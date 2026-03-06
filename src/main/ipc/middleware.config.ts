import LogMiddleware from "./middleware/log"

export default [
  {
    url: "app1/**",
    middleware: [LogMiddleware]
  }
]