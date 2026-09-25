interface config{
    DATABASE_URL:string,
    PORT:number
}



export const envConfig:config={
    DATABASE_URL:process.env.DATABASE_URL!,
    PORT:Number(process.env.PORT || 3000)
}
