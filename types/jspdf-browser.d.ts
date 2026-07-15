declare module "jspdf/dist/jspdf.es.min.js" {
  export class jsPDF {
    constructor(options?: Record<string, unknown>)
    internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
    addImage: (
      imageData: string,
      format: string,
      x: number,
      y: number,
      w: number,
      h: number,
    ) => void
    addPage: () => void
    save: (filename: string) => void
  }
}
