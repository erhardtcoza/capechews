export class Router {
  constructor() { this.routes = []; }
  on(method, path, handler) { this.routes.push({ method, path, handler }); }
  match(method, urlPath) {
    for (const r of this.routes) {
      if (method === r.method && urlPath === r.path) return r.handler;
    }
    return null;
  }
}
