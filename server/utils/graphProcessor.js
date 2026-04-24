/**
 * Hierarchy Lab – Graph Processor Utility
 * Handles edge validation, deduplication, graph construction, cycle detection,
 * multi-parent enforcement, depth calculation, and summary generation.
 */

const EDGE_REGEX = /^([A-Z])->([A-Z])$/;

/**
 * Step 1 – Validate and separate valid / invalid edges.
 * Rules:
 *   - Must be "X->Y" where X, Y are single uppercase letters A-Z
 *   - X !== Y  (no self-loops)
 *   - Trim whitespace before validation
 */
function validateEdges(data) {
  const valid = [];
  const invalid_entries = [];

  for (const raw of data) {
    if (typeof raw !== "string") {
      invalid_entries.push(raw);
      continue;
    }
    const trimmed = raw.trim();
    const match = EDGE_REGEX.exec(trimmed);
    if (!match || match[1] === match[2]) {
      invalid_entries.push(raw);
    } else {
      valid.push(trimmed);
    }
  }

  return { valid, invalid_entries };
}

/**
 * Step 2 – Deduplicate edges (only first occurrence kept).
 * Returns { unique, duplicate_edges }
 */
function deduplicateEdges(validEdges) {
  const seen = new Set();
  const unique = [];
  const duplicate_edges = [];

  for (const edge of validEdges) {
    if (seen.has(edge)) {
      // Record duplicate only once per distinct edge
      if (!duplicate_edges.includes(edge)) duplicate_edges.push(edge);
    } else {
      seen.add(edge);
      unique.push(edge);
    }
  }

  return { unique, duplicate_edges };
}

/**
 * Step 3 – Build adjacency / parent maps.
 * Multi-parent rule: if a node already has a parent (from a previous edge),
 * ignore subsequent edges that would assign a different parent.
 * Returns { adj, parentOf, nodes, ignoredEdges }
 */
function buildGraph(uniqueEdges) {
  // adj[parent] = [children]
  const adj = {};
  // parentOf[child] = parent  (first parent wins)
  const parentOf = {};
  const nodes = new Set();
  const ignoredEdges = []; // edges dropped due to multi-parent rule

  for (const edge of uniqueEdges) {
    const [parent, child] = edge.split("->"); // guaranteed valid
    nodes.add(parent);
    nodes.add(child);

    if (parentOf[child] !== undefined && parentOf[child] !== parent) {
      // Child already has a different parent – ignore
      ignoredEdges.push(edge);
      continue;
    }

    parentOf[child] = parent;
    if (!adj[parent]) adj[parent] = [];
    adj[parent].push(child);
  }

  return { adj, parentOf, nodes, ignoredEdges };
}

/**
 * Step 4 – Identify connected components (undirected sense) so we can
 * handle multiple independent trees / cycles.
 */
function getComponents(nodes, adj, parentOf) {
  const visited = new Set();
  const components = [];

  // Build undirected adjacency for component discovery
  const undirected = {};
  for (const node of nodes) {
    undirected[node] = new Set();
  }
  for (const [parent, children] of Object.entries(adj)) {
    for (const child of children) {
      undirected[parent].add(child);
      undirected[child].add(parent);
    }
  }

  for (const node of [...nodes].sort()) {
    if (visited.has(node)) continue;
    const component = new Set();
    const queue = [node];
    while (queue.length) {
      const cur = queue.shift();
      if (component.has(cur)) continue;
      component.add(cur);
      visited.add(cur);
      for (const neighbor of (undirected[cur] || [])) {
        if (!component.has(neighbor)) queue.push(neighbor);
      }
    }
    components.push([...component].sort());
  }

  return components;
}

/**
 * Step 5 – Detect cycle within a component using DFS.
 */
function hasCycle(componentNodes, adj) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of componentNodes) color[n] = WHITE;

  function dfs(u) {
    color[u] = GRAY;
    for (const v of (adj[u] || [])) {
      if (color[v] === GRAY) return true; // back edge
      if (color[v] === WHITE && dfs(v)) return true;
    }
    color[u] = BLACK;
    return false;
  }

  for (const n of componentNodes) {
    if (color[n] === WHITE && dfs(n)) return true;
  }
  return false;
}

/**
 * Step 6 – Determine root of a component.
 * Root = node with no parent in parentOf within this component.
 * If all nodes have a parent (cycle-only), use lex-smallest node.
 */
function findRoot(componentNodes, parentOf) {
  const roots = componentNodes.filter((n) => parentOf[n] === undefined);
  if (roots.length === 0) {
    // Pure cycle – pick lex smallest
    return [...componentNodes].sort()[0];
  }
  // Lex sort to get deterministic root when multiple roots exist
  return roots.sort()[0];
}

/**
 * Step 7 – Build nested tree object rooted at `root` using BFS.
 * Returns { "<root>": { "<child>": { ... } } } (depth-1 key is root itself).
 */
function buildTree(root, adj) {
  const result = {};
  result[root] = buildSubtree(root, adj, new Set());
  return result;
}

function buildSubtree(node, adj, visited) {
  if (visited.has(node)) return {};
  visited.add(node);
  const children = adj[node] || [];
  const sub = {};
  for (const child of children) {
    sub[child] = buildSubtree(child, adj, visited);
  }
  return sub;
}

/**
 * Step 8 – Compute depth (longest root-to-leaf path, counting nodes).
 */
function computeDepth(root, adj) {
  function dfs(node, visited) {
    if (visited.has(node)) return 0;
    visited.add(node);
    const children = adj[node] || [];
    if (children.length === 0) return 1;
    let max = 0;
    for (const child of children) {
      max = Math.max(max, dfs(child, new Set(visited)));
    }
    return 1 + max;
  }
  return dfs(root, new Set());
}

/**
 * Master function – processes raw data array and returns full API response body.
 */
function processHierarchy(data) {
  // 1. Validate
  const { valid, invalid_entries } = validateEdges(data);

  // 2. Deduplicate
  const { unique, duplicate_edges } = deduplicateEdges(valid);

  // 3. Build graph (respecting multi-parent rule)
  const { adj, parentOf, nodes, ignoredEdges } = buildGraph(unique);

  // 4. Get components
  const components = getComponents(nodes, adj, parentOf);

  // 5 & 6. Process each component
  const hierarchies = [];
  let total_cycles = 0;
  let largest_tree_root = null;
  let largest_tree_depth = -1;

  for (const comp of components) {
    const cyclic = hasCycle(comp, adj);
    const root = findRoot(comp, parentOf);

    if (cyclic) {
      total_cycles++;
      hierarchies.push({ root, tree: {}, has_cycle: true });
    } else {
      const treeObj = buildTree(root, adj);
      const depth = computeDepth(root, adj);

      hierarchies.push({ root, tree: treeObj, depth });

      // Track largest tree (by depth, lex-smallest root on tie)
      if (
        depth > largest_tree_depth ||
        (depth === largest_tree_depth && root < largest_tree_root)
      ) {
        largest_tree_depth = depth;
        largest_tree_root = root;
      }
    }
  }

  const total_trees = hierarchies.filter((h) => !h.has_cycle).length;

  const summary = {
    total_trees,
    total_cycles,
    largest_tree_root: largest_tree_root || null,
  };

  // Debug info (returned for frontend Debug Mode)
  const debug = {
    parsed_edges: valid,
    after_dedup: unique,
    ignored_multi_parent: ignoredEdges,
    final_adj: adj,
  };

  return { hierarchies, invalid_entries, duplicate_edges, summary, debug };
}

module.exports = { processHierarchy };
