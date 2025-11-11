export type Visita = {
    id: string;
    dataVisita: string;
    responsavelId: string;
    cuidadorId: string;
    idosoId: string;
    idosoNome?: string;
    responsavelNome?: string;
    cuidadorNome?:string;
    localVisita?: string;
};