const EDGE_REGEX = /^([A-Z])->([A-Z])$/;

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

function deduplicateEdges(validEdges) {
  const seen = new Set();
  const unique = [];
  const duplicate_edges = [];

  for (const edge of validEdges) {
    if (seen.has(edge)) {
      if (!duplicate_edges.includes(edge)) duplicate_edges.push(edge);
    } else {
      seen.add(edge);
      unique.push(edge);
    }
  }

  return { unique, duplicate_edges };
}

function buildGraph(uniqueEdges) {
  const adj = {};
  const parentOf = {};
  const nodes = new Set();
  const ignoredEdges = [];

  for (const edge of uniqueEdges) {
    const [parent, child] = edge.split("->");
    nodes.add(parent);
    nodes.add(child);

    if (parentOf[child] !== undefined && parentOf[child] !== parent) {
      ignoredEdges.push(edge);
      continue;
    }

    parentOf[child] = parent;
    if (!adj[parent]) adj[parent] = [];
    adj[parent].push(child);
  }

  return { adj, parentOf, nodes, ignoredEdges };
}

function getComponents(nodes, adj, parentOf) {
  const visited = new Set();
  const components = [];

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

function hasCycle(componentNodes, adj) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = {};
  for (const n of componentNodes) color[n] = WHITE;

  function dfs(u) {
    color[u] = GRAY;
    for (const v of (adj[u] || [])) {
      if (color[v] === GRAY) return true;
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

function findRoot(componentNodes, parentOf) {
  const roots = componentNodes.filter((n) => parentOf[n] === undefined);
  if (roots.length === 0) {
    return [...componentNodes].sort()[0];
  }
  return roots.sort()[0];
}

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

function processHierarchy(data) {
  const { valid, invalid_entries } = validateEdges(data);

  const { unique, duplicate_edges } = deduplicateEdges(valid);

  const { adj, parentOf, nodes, ignoredEdges } = buildGraph(unique);

  const components = getComponents(nodes, adj, parentOf);

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

  const debug = {
    parsed_edges: valid,
    after_dedup: unique,
    ignored_multi_parent: ignoredEdges,
    final_adj: adj,
  };

  return { hierarchies, invalid_entries, duplicate_edges, summary, debug };
}

module.exports = { processHierarchy };
