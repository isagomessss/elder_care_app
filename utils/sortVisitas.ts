import { Visita } from "@/types/Visita";

const getTimeFromData = (data: any): number => {
        if (!data) return Number.MAX_SAFE_INTEGER; // joga pro fim se vier vazio
        if (typeof data === "string") {
            const t = Date.parse(data);
            return isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
        }
        if (typeof data === "object" && typeof data._seconds === "number") {
            return data._seconds * 1000;
        }
        if (data instanceof Date) return data.getTime();
        return Number.MAX_SAFE_INTEGER;
    };

// comparação por data (asc = mais próximas primeiro)
    const compareByDate = (a: any, b: any, asc = true) => {
        const ta = getTimeFromData(a.dataVisita);
        const tb = getTimeFromData(b.dataVisita);
        return asc ? ta - tb : tb - ta;
    };


export const sortVisitas = (data: Visita[], sortOption: any) => {
        const sorted = [...data];
        switch (sortOption) {
            case "distantes":
                return sorted.sort((a, b) => compareByDate(a, b, false)); // mais longe primeiro
            case "az":
                return sorted.sort((a, b) =>
                    (a.idosoNome || "").localeCompare(b.idosoNome || "")
                );
            case "za":
                return sorted.sort((a, b) =>
                    (b.idosoNome || "").localeCompare(a.idosoNome || "")
                );
            default: // "proximas"
                return sorted.sort((a, b) => compareByDate(a, b, true)); // mais próximas primeiro
        }
    };
