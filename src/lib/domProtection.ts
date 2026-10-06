/**
 * Browser Translation Protection & DOM Resilience Patch
 *
 * When browsers (Chrome, Edge, Safari) or translation extensions
 * translate a page, they mutate DOM text nodes (e.g. wrapping in <font>).
 * React's Virtual DOM reconciliation then fails with:
 * "NotFoundError: Failed to execute 'removeChild' on 'Node'" or
 * "Failed to execute 'insertBefore' on 'Node'", crashing the application.
 *
 * This patch intercepts these calls and gracefully recovers to prevent React from crashing.
 */

export function setupDomProtection(): void {
  if (typeof window === 'undefined' || typeof Node === 'undefined' || !Node.prototype) {
    return
  }

  const originalRemoveChild = Node.prototype.removeChild
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[domProtection] Prevented removeChild crash caused by browser translation.',
          this,
          child
        )
      }
      if (child.parentNode) {
        child.parentNode.removeChild(child)
      }
      return child
    }
    return originalRemoveChild.call(this, child) as T
  }

  const originalInsertBefore = Node.prototype.insertBefore
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (typeof console !== 'undefined' && console.warn) {
        console.warn(
          '[domProtection] Prevented insertBefore crash caused by browser translation.',
          this,
          referenceNode
        )
      }
      return originalInsertBefore.call(this, newNode, null) as T
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T
  }
}

// Automatically execute on import
setupDomProtection()
