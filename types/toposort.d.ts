declare module "toposort" {
  /**
   * Sort an array of edges [from, to] topologically.
   * Throws if a cycle is detected.
   */
  function toposort(edges: [string, string][]): string[]

  namespace toposort {
    /**
     * Sort an explicit list of nodes with an edge list.
     * Nodes not appearing in any edge are included in the output.
     */
    function array(nodes: string[], edges: [string, string][]): string[]
  }

  export = toposort
}
