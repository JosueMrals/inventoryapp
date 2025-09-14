export interface Product {
  id: number;
  name: string;
  price: number;
  barcode?: string;
  description?: string;
  image?: string | File; // File al enviar, string (URL) al recibir
}
