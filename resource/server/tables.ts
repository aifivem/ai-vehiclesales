// Generated from sql/main.sql by aicore-db-types (the build runs it). Do not edit: change the SQL and build.

/** Row of each table as @aicore-fivem/mysql returns it. */
export type Tables = {
  ai_vehiclesales_listings: {
    id: number;
    vehicle_id: number | string;
    lot: string;
    seller: number;
    seller_name: string;
    model: string;
    plate: string;
    price: number;
    description: string;
    created_at: number;
  };
  ai_vehiclesales_payouts: {
    id: number;
    seller: number;
    amount: number;
    model: string;
    plate: string;
    created_at: number;
  };
};

/** What an INSERT needs: columns with a default, NULL or AUTO_INCREMENT may be left out. */
export type TableInserts = {
  ai_vehiclesales_listings: {
    id?: number;
    vehicle_id: number | string;
    lot: string;
    seller: number;
    seller_name: string;
    model: string;
    plate: string;
    price: number;
    description?: string;
    created_at?: number;
  };
  ai_vehiclesales_payouts: {
    id?: number;
    seller: number;
    amount: number;
    model: string;
    plate: string;
    created_at?: number;
  };
};
