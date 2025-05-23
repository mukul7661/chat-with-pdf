declare module "pdf-parse" {
  export default function (
    dataBuffer: Buffer,
    options?: any
  ): Promise<{
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    text: string;
    version: string;
  }>;
}

declare module "pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js" {
  export function getDocument(data: any): any;
}
