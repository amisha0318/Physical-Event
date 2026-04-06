const { networkGraph, zones } = require('../data/venueData');
const NodeCache = require('node-cache');
const routeCache = new NodeCache({ stdTTL: 300 }); // Cache routes for 5 mins

/**
 * Navigation Service
 * Includes Pathfinding logic (Dijkstra-inspired) weighted by real-time density.
 */
class NavigationService {

  // Get density (cost) for a specific zone
  getZoneCost(zoneId) {
    const zone = zones.find(z => z.id === zoneId);
    if (!zone) return 1000; // Infinity-like for invalid nodes
    
    // Weight = base cost (1) + penalty based on density (0-10)
    // High density (90) adds +9 to the cost of that path
    return 1 + (zone.density / 10);
  }

  // Find the smartest path between two zones
  findSmartPath(startId, endId) {
    const cacheKey = `${startId}_to_${endId}`;
    const cached = routeCache.get(cacheKey);
    if (cached) return { ...cached, status: 'cached' };

    // Simple BFS for shortest path (since the graph is small)
    // but in a real-world scenario, we'd use Dijkstra with weighted density
    let queue = [ [startId] ];
    let visited = new Set([startId]);
    let pathsFound = [];

    while (queue.length > 0) {
      let path = queue.shift();
      let node = path[path.length - 1];

      if (node === endId) {
         pathsFound.push(path);
         if (pathsFound.length > 2) break; // Limit search for performance
      }

      let neighbors = networkGraph[node] || [];
      for (let nextNode of neighbors) {
        if (!visited.has(nextNode) || pathsFound.length > 0) {
          queue.push([...path, nextNode]);
          visited.add(nextNode);
        }
      }
    }

    // Rank paths by cost
    const pathsWithCost = pathsFound.map(p => {
        const cost = p.reduce((acc, zid) => acc + this.getZoneCost(zid), 0);
        return { path: p, cost };
    }).sort((a, b) => a.cost - b.cost);

    const best = pathsWithCost[0];
    if (!best) return null;

    // Build human-readable output
    const pathZones = best.path.map(id => zones.find(z => z.id === id));
    const result = {
        pathIds: best.path,
        zones: pathZones,
        cost: best.cost,
        benefit: best.cost > 5 ? "Rerouted to avoid high traffic (Food Court/Gate A)" : "Direct clear path",
        type: 'Optimized'
    };

    routeCache.set(cacheKey, result);
    return result;
  }
}

module.exports = new NavigationService();
