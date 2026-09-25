import app from "@/app";
import { envConfig } from "@/config/envConfig";



app.listen(envConfig.PORT,()=>{
    console.log(`server is listening at port ${envConfig.PORT}`);
})
