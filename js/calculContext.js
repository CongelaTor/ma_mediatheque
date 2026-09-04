(function (globalScope) {
  //---------------
  // ENVIRONMENT
  //---------------
  function detectEnvironment(options = {}) {
    const isBrowser =
      typeof window !== "undefined" && typeof document !== "undefined";
    const platform =
      options.platform ||
      (isBrowser
        ? /Linux/i.test(navigator.platform)
          ? "linux"
          : "windows"
        : process.platform === "linux"
          ? "linux"
          : "windows");
    const hostname =
      options.hostname || (isBrowser ? window.location.hostname : "");
    const isGitUrl =
      options.isGitUrl ??
      ["github.io", "congelator.github.io"].some(
        (value) => hostname === value || hostname.endsWith(`.${value}`),
      );
    const isLocalUrl =
      options.isLocalUrl ?? ["127.0.0.1", "localhost"].includes(hostname);
    const mediaServerAvailable = Boolean(options.mediaServerAvailable);
    const isDevPc = Boolean(options.isDevPc);
    console.log("[calculContext][Environment]", {
      isBrowser,
      platform,
      hostname,
      isGitUrl,
      isLocalUrl,
      mediaServerAvailable,
      isDevPc,
    });

    return {
      isBrowser,
      platform,
      hostname,
      isGitUrl,
      isLocalUrl,
      mediaServerAvailable,
      isDevPc,
    };
  }

  //---------------
  // CHEMINS
  //---------------
  function calculatePaths(environment, options = {}) {
    // Windows : chemins physiques de forme C:\dossier\fichier ou Z:\dossier\fichier.
    // Linux : chemins physiques de forme /dossier/fichier, sans antislash.
    // Git : chemins Web relatifs de forme data/fichier.json, sans lettre de lecteur.
    const currentDir = options.currentDir || null;

    const windowsMediathequeRoot =
      options.windowsMediathequeRoot ||
      "C:\\Users\\alnos\\Documents\\Projets\\ma_mediatheque";
    const windowsMediaServerRoot =
      options.windowsMediaServerRoot || "Z:\\01_mediaServer";

    const mediathequeRoot =
      environment.platform === "windows" ? windowsMediathequeRoot : null;
    const mediaServerRoot =
      environment.platform === "windows" ? windowsMediaServerRoot : currentDir;

    const separator = environment.platform === "windows" ? "\\" : "/";
    const joinPhysical = (...parts) =>
      parts
        .filter(Boolean)
        .join(separator)
        .replace(
          environment.platform === "windows" ? /\\+/g : /\/{2,}/g,
          separator,
        );
    const catalogUrl = environment.mediaServerAvailable
      ? "http://localhost:9876/get-catalog"
      : "data/catalog.json";
    const result = {
      mediathequeRoot,
      mediaServerRoot,
      catalogPath: mediathequeRoot
        ? joinPhysical(mediathequeRoot, "data", "catalog.json")
        : null,
      configPath: mediaServerRoot
        ? joinPhysical(mediaServerRoot, "config", "config.json")
        : null,
      ignoreWordsPath: mediaServerRoot
        ? joinPhysical(mediaServerRoot, "config", "ignoreWords.json")
        : null,
      languageAliasesPath: mediathequeRoot
        ? joinPhysical(mediathequeRoot, "config", "languageAliases.json")
        : "config/languageAliases.json",
      resumePlaybackPath: mediaServerRoot
        ? joinPhysical(mediaServerRoot, "data", "01_reprise_vlc.json")
        : null,
      generateCatalogPath: mediathequeRoot
        ? joinPhysical(mediathequeRoot, "controller", "generateCatalog.js")
        : null,
      catalogUrl,
    };
    console.log("[calculContext][Paths]", result);
    return result;
  }

  //---------------
  // PERMISSIONS
  //---------------
  function calculatePermissions(environment) {
    const canUseMediaServer = environment.mediaServerAvailable;
    const result = {
      canScan: canUseMediaServer && environment.isDevPc,
      canPlay: canUseMediaServer,
      canResume: canUseMediaServer,
      canSynchronize: canUseMediaServer,
      canAssociateTmdb: canUseMediaServer && environment.isDevPc,
      canUseGreyButtons: canUseMediaServer && environment.isDevPc,
      canPublishCatalog: canUseMediaServer && environment.isDevPc,
      canRequest: environment.isGitUrl && !environment.isDevPc,
    };
    console.log("[calculContext][Permissions]", result);
    return result;
  }

  //------------------------
  // CALCUL CONTEXTE GLOBAL
  //------------------------
  function calculateContext(options = {}) {
    // Étape 1 : prise en compte de l'environnement.
    const environment = detectEnvironment(options);
    // Étape 2 : calcul de tous les chemins utiles.
    const paths = calculatePaths(environment, options);
    // Étape 3 : calcul des autorisations.
    const permissions = calculatePermissions(environment);
    const result = {
      environment,
      paths,
      permissions,
    };
    console.log("[calculContext][Context]", result);
    return result;
  }

  const calculContext = {
    detectEnvironment,
    calculateContext,
    calculatePaths,
    calculatePermissions,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = calculContext;
  }

  globalScope.calculContext = calculContext;
})(typeof globalThis !== "undefined" ? globalThis : this);
