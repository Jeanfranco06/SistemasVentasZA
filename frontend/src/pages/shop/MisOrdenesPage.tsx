import { useEffect, useState } from 'react';
import api from '../../services/api';

export const MisOrdenesPage = () => {
  const [ordenes, setOrdenes] = useState([]);

  useEffect(() => {
    api.get('/clientes/ordenes')
      .then(res => setOrdenes(res.data.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Mis Órdenes</h1>
      {ordenes.length === 0 ? (
        <p>No tienes órdenes registradas.</p>
      ) : (
        <div className="space-y-4">
          {ordenes.map((orden: any) => (
            <div key={orden.id} className="border p-4 rounded shadow">
              <p>Orden ID: {orden.id}</p>
              <p>Total: ${orden.total}</p>
              <p>Estado: {orden.estadoId}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
