export default {
  firstParty: [
    {
      name: "@galacean/engine-xr",
      path: "packages/xr"
    },
    {
      name: "@galacean/engine-xr-webxr",
      path: "packages/xr-webxr"
    },
    {
      name: "@galacean/engine-ui",
      path: "packages/ui"
    },
    {
      name: "@galacean/engine-physics-lite",
      path: "packages/physics-lite"
    },
    {
      name: "@galacean/engine-physics-physx",
      path: "packages/physics-physx"
    },
    {
      name: "@galacean/engine-shaderlab",
      path: "packages/shader-lab"
    },
    {
      name: "@galacean/engine-shader",
      path: "packages/shader"
    }
  ],

  secondParty: [
    {
      name: "@galacean/engine-toolkit",
      repo: "https://github.com/galacean/engine-toolkit.git",
      isMonorepo: true,
      buildCommand: "pnpm b:all",
      packages: [
        {
          name: "@galacean/engine-toolkit",
          packagePath: "packages/galacean-engine-toolkit"
        },
        {
          name: "@galacean/engine-toolkit-xr",
          packagePath: "packages/xr"
        }
      ]
    },
    {
      name: "@galacean/engine-lottie",
      repo: "https://github.com/galacean/engine-lottie.git",
      packagePath: ".",
      buildCommand: "pnpm build"
    },
    {
      name: "@galacean/engine-spine",
      repo: "https://github.com/galacean/engine-spine.git",
      branch: "4.2",
      packagePath: ".",
      buildCommand: "pnpm build"
    }
  ]
};
