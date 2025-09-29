import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export class DatabaseCleaner {
  /**
   * Limpia todos los datos de empleados de Firebase y localStorage
   */
  static async clearAllEmployees(): Promise<void> {
    try {
      console.log('🧹 Limpiando empleados...');

      // Limpiar Firebase
      if (db) {
        const employeesRef = collection(db, 'employees');
        const snapshot = await getDocs(employeesRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ Eliminados ${snapshot.docs.length} empleados de Firebase`);
      }

      // Limpiar localStorage
      localStorage.removeItem('empleados-data');
      console.log('✅ Datos de empleados limpiados de localStorage');

    } catch (error) {
      console.error('❌ Error limpiando empleados:', error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos de clientes de Firebase y localStorage
   */
  static async clearAllClients(): Promise<void> {
    try {
      console.log('🧹 Limpiando clientes...');

      // Limpiar Firebase
      if (db) {
        const clientsRef = collection(db, 'clients');
        const snapshot = await getDocs(clientsRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ Eliminados ${snapshot.docs.length} clientes de Firebase`);
      }

      // Limpiar localStorage
      localStorage.removeItem('clientes-data');
      console.log('✅ Datos de clientes limpiados de localStorage');

    } catch (error) {
      console.error('❌ Error limpiando clientes:', error);
      throw error;
    }
  }

  /**
   * Limpia todos los datos de proyectos de Firebase y localStorage
   */
  static async clearAllProjects(): Promise<void> {
    try {
      console.log('🧹 Limpiando proyectos...');

      // Limpiar Firebase
      if (db) {
        const projectsRef = collection(db, 'projects');
        const snapshot = await getDocs(projectsRef);

        const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        console.log(`✅ Eliminados ${snapshot.docs.length} proyectos de Firebase`);
      }

      // Limpiar localStorage
      localStorage.removeItem('proyectos-data');
      console.log('✅ Datos de proyectos limpiados de localStorage');

    } catch (error) {
      console.error('❌ Error limpiando proyectos:', error);
      throw error;
    }
  }

  /**
   * Limpia TODOS los datos de la aplicación (empleados, clientes, proyectos)
   */
  static async clearAllData(): Promise<void> {
    try {
      console.log('🚨 Iniciando limpieza completa de la base de datos...');

      await Promise.all([
        this.clearAllEmployees(),
        this.clearAllClients(),
        this.clearAllProjects()
      ]);

      // Limpiar otros datos de localStorage
      localStorage.removeItem('userRole_admin@columbito.com');
      localStorage.removeItem('userRole_usuario@empresa.com');
      localStorage.removeItem('userRole_jefe@construccion.com');

      console.log('🎉 ¡Limpieza completa finalizada!');
      console.log('📝 La aplicación está lista para ingresar nuevos datos.');

    } catch (error) {
      console.error('❌ Error en limpieza completa:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas de los datos actuales
   */
  static async getDataStats(): Promise<{
    employees: number;
    clients: number;
    projects: number;
    totalRecords: number;
  }> {
    try {
      let employeesCount = 0;
      let clientsCount = 0;
      let projectsCount = 0;

      if (db) {
        const [employeesSnap, clientsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, 'employees')),
          getDocs(collection(db, 'clients')),
          getDocs(collection(db, 'projects'))
        ]);

        employeesCount = employeesSnap.size;
        clientsCount = clientsSnap.size;
        projectsCount = projectsSnap.size;
      }

      return {
        employees: employeesCount,
        clients: clientsCount,
        projects: projectsCount,
        totalRecords: employeesCount + clientsCount + projectsCount
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return { employees: 0, clients: 0, projects: 0, totalRecords: 0 };
    }
  }
}

// Función global para facilitar el uso desde la consola del navegador
if (typeof window !== 'undefined') {
  (window as any).DatabaseCleaner = DatabaseCleaner;
}

export {};