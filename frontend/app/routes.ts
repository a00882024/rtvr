import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("notebooks", "routes/notebooks.tsx"),
  route("notebooks/new", "routes/notebooks.new.tsx"),
  route("notebooks/:id", "routes/notebooks.$id.tsx"),
  route("notebooks/:id/edit", "routes/notebooks.$id.edit.tsx"),
  route("notebooks/:id/documents/new", "routes/notebooks.$id.documents.new.tsx"),
  route("documents", "routes/documents.tsx"),
  route("documents/:id", "routes/documents.$id.tsx"),
] satisfies RouteConfig;
