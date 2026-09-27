interface config{
    DATABASE_URL:string,
    PORT:number,
    JWT_SECRET:string,
    NODE_ENV:string,
    JWT_EXPIRES_IN:string,
    RAGX_ENCRYPTION_KEY:string,
    WEB_APP_URL:string,
    STORAGE_DIR:string,
}



export const envConfig:config={
    DATABASE_URL:process.env.DATABASE_URL!,
    PORT:Number(process.env.PORT || 3000),
    JWT_SECRET:process.env.JWT_SECRET || "dev-only-secret-change-in-production",
    NODE_ENV:process.env.NODE_ENV || "development",
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN || "7d",
    RAGX_ENCRYPTION_KEY:process.env.RAGX_ENCRYPTION_KEY || "",
    WEB_APP_URL:process.env.WEB_APP_URL || "http://localhost:3000",
    STORAGE_DIR:process.env.RAGX_STORAGE_DIR || "./storage",
}
