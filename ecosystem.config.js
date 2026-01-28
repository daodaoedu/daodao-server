module.exports = {
    apps: [
      {
        name: "node_app",
        script: "index.js",
        instances: "max",
        exec_mode: "cluster",
      }
    ]
  };
  