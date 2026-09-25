interface config{
    DATABASE_URL:string,
    PORT:number,
    JWT_SECRET:string,
    NODE_ENV:string,
    JWT_EXPIRES_IN:string,
}



export const envConfig:config={
    DATABASE_URL:process.env.DATABASE_URL!,
    PORT:Number(process.env.PORT || 3000),
    JWT_SECRET:process.env.JWT_SECRET || "dev-only-secret-change-in-production",
    NODE_ENV:process.env.NODE_ENV || "development",
    JWT_EXPIRES_IN:process.env.JWT_EXPIRES_IN || "7d",
}
