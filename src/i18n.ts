type Locale = "en" | "es" | "fr" | "pt-BR";
type Params = Record<string, string | number>;

type I18nHost = {
	events?: { emit?: (name: string, payload: unknown) => void };
};

const translations: Record<Exclude<Locale, "en">, Record<string, string>> = {
	es: {
		"status.notInitialized": "fff: no inicializado",
		"status.version": "fff v{version}",
		"status.indexed": "Indexados: {count} archivos",
		"status.path": "Ruta: {path}",
		"status.scanning": "Escaneando: {value}",
		"status.frecency": "frecency: {value}",
		"status.git": "git: {value}",
		"value.yes": "sí",
		"value.no": "no",
		"value.enabled": "activado",
		"value.disabled": "desactivado",
		"value.repoFound": "repositorio encontrado",
		"value.availableNoRepo": "disponible, sin repositorio",
		"value.unavailable": "no disponible",
	},
	fr: {
		"status.notInitialized": "fff : non initialisé",
		"status.version": "fff v{version}",
		"status.indexed": "Indexés : {count} fichiers",
		"status.path": "Chemin : {path}",
		"status.scanning": "Analyse : {value}",
		"status.frecency": "frecency : {value}",
		"status.git": "git : {value}",
		"value.yes": "oui",
		"value.no": "non",
		"value.enabled": "activée",
		"value.disabled": "désactivée",
		"value.repoFound": "dépôt trouvé",
		"value.availableNoRepo": "disponible, aucun dépôt",
		"value.unavailable": "indisponible",
	},
	"pt-BR": {
		"status.notInitialized": "fff: não inicializado",
		"status.version": "fff v{version}",
		"status.indexed": "Indexados: {count} arquivos",
		"status.path": "Caminho: {path}",
		"status.scanning": "Escaneando: {value}",
		"status.frecency": "frecency: {value}",
		"status.git": "git: {value}",
		"value.yes": "sim",
		"value.no": "não",
		"value.enabled": "ativada",
		"value.disabled": "desativada",
		"value.repoFound": "repositório encontrado",
		"value.availableNoRepo": "disponível, sem repositório",
		"value.unavailable": "indisponível",
	},
};

let currentLocale: Locale = "en";

export function initI18n(host: I18nHost): void {
	host.events?.emit?.("pi-core/i18n/registerBundle", {
		namespace: "fff-pi",
		defaultLocale: "en",
		locales: translations,
	});

	host.events?.emit?.("pi-core/i18n/requestApi", {
		onReady: (api: { getLocale?: () => string; onLocaleChange?: (cb: (locale: string) => void) => void }) => {
			const next = api.getLocale?.();
			if (isLocale(next)) currentLocale = next;
			api.onLocaleChange?.((locale) => {
				if (isLocale(locale)) currentLocale = locale;
			});
		},
	});
}

export function t(key: string, fallback: string, params: Params = {}): string {
	const template = currentLocale === "en" ? fallback : translations[currentLocale]?.[key] ?? fallback;
	return template.replace(/\{(\w+)\}/g, (_, name) => String(params[name] ?? `{${name}}`));
}

function isLocale(locale: string | undefined): locale is Locale {
	return locale === "en" || locale === "es" || locale === "fr" || locale === "pt-BR";
}
