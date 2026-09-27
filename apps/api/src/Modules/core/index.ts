import getMimeType from "@/Utils/getMimeType";
import { loadDocument } from "../Ingestion/Loaders";
import { parserRegistry } from "../Ingestion/Parsers";
import path from "node:path";

export interface RAGXConfig{
    RAGXapiKey?:string

}
export type ChunkingStrategy =
  | "fixed"
  | "recursive"
  | "semantic";

export interface UploadOptions {
  chunking?: {
    strategy?: ChunkingStrategy;
    chunkSize?: number;
    overlap?: number;
  };
}


export class RAGX{
    private readonly RAGXapiKey: string;
    constructor(config: RAGXConfig) {
        if (!config.RAGXapiKey) {
            throw new Error("RAGX API key is required");
        }

        this.RAGXapiKey = config.RAGXapiKey;
    }


    upload=async(file:string,
        options?:UploadOptions
    )=>{
        const strategy =options?.chunking?.strategy ?? "semantic";
        const mimeType=getMimeType(file)
        const fileName=path.basename(file)
        //?Todo  :Load document from the path using fs and detect based on the mime type
        const data=await this.loadDocument(file)


        //?Todo : Parse documents
        const parsedData=await this.parseDocument(data,mimeType,fileName)


        //?Todo : Clean the documents and extract the datas

        //?Todo : Split the data into chunks

        //?Todo : Embed the documents

        //?Todo : Store the documents
    }

    private loadDocument=async(filePath:string)=>{
        const mimeType=getMimeType(filePath)
        const data=await loadDocument(filePath)
        return data
    }


    private parseDocument=async(data:any,mimeType:string,fileName:string)=>{
        const parser=parserRegistry.get(mimeType)
        return parser.parse({data,fileName})
    }

    private cleanDocument=async(document:any)=>{


    }

    private chunkDocument=async()=>{

    }

    private embedDocument=async()=>{

    }

    private storeDocument=async()=>{

    }





}
