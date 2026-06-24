const DB_NAME = 'TalitaKumOfflineDB';
const DB_VERSION = 1;

export interface OfflineIntervention {
  id: string;
  terapeutaId: string;
  pacienteId: string;
  fechaIntervencion: string;
  objetivo: string;
  desarrollo: string;
  acuerdos: string;
  accionesSeguir: string;
  observaciones: string;
  validadoPorTerapeuta: boolean;
  audioBlob?: Blob | null;
  estadoSincronizacion: 'offline' | 'pendiente' | 'sincronizado';
  fechaCreacion: string;
}

export function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('No se pudo abrir IndexedDB'));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store para guardar intervenciones offline
      if (!db.objectStoreNames.contains('intervenciones')) {
        db.createObjectStore('intervenciones', { keyPath: 'id' });
      }

      // Store para cachear datos necesarios sin conexión (Catálogos)
      if (!db.objectStoreNames.contains('catalogos')) {
        db.createObjectStore('catalogos', { keyPath: 'tipo' });
      }
    };
  });
}

// Intervenciones
export async function guardarIntervencionOffline(intervencion: OfflineIntervention): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('intervenciones', 'readwrite');
    const store = transaction.objectStore('intervenciones');
    const request = store.put(intervencion);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Error al guardar intervención en IndexedDB'));
  });
}

export async function obtenerIntervencionesOffline(): Promise<OfflineIntervention[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('intervenciones', 'readonly');
    const store = transaction.objectStore('intervenciones');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(new Error('Error al obtener intervenciones de IndexedDB'));
  });
}

export async function eliminarIntervencionOffline(id: string): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('intervenciones', 'readwrite');
    const store = transaction.objectStore('intervenciones');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Error al eliminar intervención de IndexedDB'));
  });
}

// Catálogos (Pacientes y Terapeutas) para uso offline
export async function cachearCatalogo(tipo: 'pacientes' | 'usuarios', datos: any[]): Promise<void> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('catalogos', 'readwrite');
    const store = transaction.objectStore('catalogos');
    const request = store.put({ tipo, datos, actualizadoEn: new Date().toISOString() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error(`Error al cachear catálogo de ${tipo}`));
  });
}

export async function obtenerCatalogoCacheado(tipo: 'pacientes' | 'usuarios'): Promise<any[]> {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('catalogos', 'readonly');
    const store = transaction.objectStore('catalogos');
    const request = store.get(tipo);

    request.onsuccess = () => {
      resolve(request.result?.datos || []);
    };
    request.onerror = () => reject(new Error(`Error al obtener catálogo cacheado de ${tipo}`));
  });
}
