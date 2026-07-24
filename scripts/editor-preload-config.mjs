export default {
  firstParty: [
    {
      name: "@oasishub/engine-xr",
      path: "packages/xr"
    },
    {
      name: "@oasishub/engine-xr-webxr",
      path: "packages/xr-webxr"
    },
    {
      name: "@oasishub/engine-ui",
      path: "packages/ui"
    },
    {
      name: "@oasishub/engine-physics-lite",
      path: "packages/physics-lite"
    },
    {
      name: "@oasishub/engine-physics-physx",
      path: "packages/physics-physx"
    },
    {
      name: "@oasishub/engine-shaderlab",
      path: "packages/shader-lab"
    },
    {
      name: "@oasishub/engine-shader",
      path: "packages/shader"
    }
  ],

  secondParty: [
    {
      name: "@oasishub/engine-toolkit",
      repo: "https://github.com/oasishub/engine-toolkit.git",
      isMonorepo: true,
      buildCommand: "pnpm b:all",
      packages: [
        {
          name: "@oasishub/engine-toolkit",
          packagePath: "packages/oasishub-engine-toolkit"
        },
        {
          name: "@oasishub/engine-toolkit-xr",
          packagePath: "packages/xr"
        }
      ]
    },
    {
      name: "@oasishub/engine-lottie",
      repo: "https://github.com/oasishub/engine-lottie.git",
      packagePath: ".",
      buildCommand: "pnpm build"
    },
    {
      name: "@oasishub/engine-spine",
      repo: "https://github.com/oasishub/engine-spine.git",
      branch: "4.2",
      packagePath: ".",
      buildCommand: "pnpm build"
    }
  ]
};
