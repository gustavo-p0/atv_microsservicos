import { Item } from './types';

export const seedItems: Omit<Item, 'id' | 'createdAt'>[] = [
  // ALIMENTOS
  {
    name: 'Arroz Branco 5kg',
    category: 'Alimentos',
    brand: 'Tio João',
    unit: 'un',
    averagePrice: 12.50,
    barcode: '7891234567890',
    description: 'Arroz branco tipo 1, pacote 5kg',
    active: true
  },
  {
    name: 'Feijão Preto 1kg',
    category: 'Alimentos',
    brand: 'Camil',
    unit: 'un',
    averagePrice: 8.90,
    barcode: '7891234567891',
    description: 'Feijão preto tipo 1, pacote 1kg',
    active: true
  },
  {
    name: 'Macarrão Espaguete 500g',
    category: 'Alimentos',
    brand: 'Barilla',
    unit: 'un',
    averagePrice: 4.50,
    barcode: '7891234567892',
    description: 'Macarrão espaguete, pacote 500g',
    active: true
  },
  {
    name: 'Açúcar Cristal 1kg',
    category: 'Alimentos',
    brand: 'União',
    unit: 'un',
    averagePrice: 3.20,
    barcode: '7891234567893',
    description: 'Açúcar cristal refinado, pacote 1kg',
    active: true
  },
  {
    name: 'Óleo de Soja 900ml',
    category: 'Alimentos',
    brand: 'Liza',
    unit: 'un',
    averagePrice: 5.80,
    barcode: '7891234567894',
    description: 'Óleo de soja refinado, garrafa 900ml',
    active: true
  },

  // LIMPEZA
  {
    name: 'Detergente Líquido 500ml',
    category: 'Limpeza',
    brand: 'Ypê',
    unit: 'un',
    averagePrice: 2.50,
    barcode: '7891234567895',
    description: 'Detergente líquido neutro, frasco 500ml',
    active: true
  },
  {
    name: 'Sabão em Pó 1kg',
    category: 'Limpeza',
    brand: 'Omo',
    unit: 'un',
    averagePrice: 8.90,
    barcode: '7891234567896',
    description: 'Sabão em pó para roupas, pacote 1kg',
    active: true
  },
  {
    name: 'Amaciante 2L',
    category: 'Limpeza',
    brand: 'Comfort',
    unit: 'un',
    averagePrice: 12.50,
    barcode: '7891234567897',
    description: 'Amaciante de roupas, garrafa 2L',
    active: true
  },
  {
    name: 'Desinfetante 1L',
    category: 'Limpeza',
    brand: 'Pinho Sol',
    unit: 'un',
    averagePrice: 6.90,
    barcode: '7891234567898',
    description: 'Desinfetante multiuso, frasco 1L',
    active: true
  },
  {
    name: 'Papel Higiênico 4 rolos',
    category: 'Limpeza',
    brand: 'Neve',
    unit: 'un',
    averagePrice: 4.50,
    barcode: '7891234567899',
    description: 'Papel higiênico macio, pacote 4 rolos',
    active: true
  },

  // HIGIENE
  {
    name: 'Shampoo 400ml',
    category: 'Higiene',
    brand: 'Pantene',
    unit: 'un',
    averagePrice: 15.90,
    barcode: '7891234567900',
    description: 'Shampoo para cabelos normais, frasco 400ml',
    active: true
  },
  {
    name: 'Condicionador 400ml',
    category: 'Higiene',
    brand: 'Pantene',
    unit: 'un',
    averagePrice: 15.90,
    barcode: '7891234567901',
    description: 'Condicionador para cabelos normais, frasco 400ml',
    active: true
  },
  {
    name: 'Sabonete 90g',
    category: 'Higiene',
    brand: 'Dove',
    unit: 'un',
    averagePrice: 3.50,
    barcode: '7891234567902',
    description: 'Sabonete hidratante, barra 90g',
    active: true
  },
  {
    name: 'Creme Dental 90g',
    category: 'Higiene',
    brand: 'Colgate',
    unit: 'un',
    averagePrice: 4.90,
    barcode: '7891234567903',
    description: 'Creme dental com flúor, tubo 90g',
    active: true
  },
  {
    name: 'Escova de Dentes',
    category: 'Higiene',
    brand: 'Oral-B',
    unit: 'un',
    averagePrice: 8.50,
    barcode: '7891234567904',
    description: 'Escova de dentes macia, unidade',
    active: true
  },

  // BEBIDAS
  {
    name: 'Refrigerante Cola 2L',
    category: 'Bebidas',
    brand: 'Coca-Cola',
    unit: 'un',
    averagePrice: 6.90,
    barcode: '7891234567905',
    description: 'Refrigerante de cola, garrafa 2L',
    active: true
  },
  {
    name: 'Suco de Laranja 1L',
    category: 'Bebidas',
    brand: 'Del Valle',
    unit: 'un',
    averagePrice: 4.50,
    barcode: '7891234567906',
    description: 'Suco de laranja natural, caixa 1L',
    active: true
  },
  {
    name: 'Água Mineral 500ml',
    category: 'Bebidas',
    brand: 'Crystal',
    unit: 'un',
    averagePrice: 1.50,
    barcode: '7891234567907',
    description: 'Água mineral natural, garrafa 500ml',
    active: true
  },
  {
    name: 'Cerveja 350ml',
    category: 'Bebidas',
    brand: 'Skol',
    unit: 'un',
    averagePrice: 2.90,
    barcode: '7891234567908',
    description: 'Cerveja pilsen, lata 350ml',
    active: true
  },
  {
    name: 'Café Solúvel 200g',
    category: 'Bebidas',
    brand: 'Nescafé',
    unit: 'un',
    averagePrice: 12.90,
    barcode: '7891234567909',
    description: 'Café solúvel tradicional, pote 200g',
    active: true
  },

  // PADARIA
  {
    name: 'Pão de Forma 500g',
    category: 'Padaria',
    brand: 'Wickbold',
    unit: 'un',
    averagePrice: 4.90,
    barcode: '7891234567910',
    description: 'Pão de forma integral, pacote 500g',
    active: true
  },
  {
    name: 'Pão Francês',
    category: 'Padaria',
    brand: 'Padaria Local',
    unit: 'un',
    averagePrice: 0.50,
    barcode: '7891234567911',
    description: 'Pão francês tradicional, unidade',
    active: true
  },
  {
    name: 'Biscoito Recheado 130g',
    category: 'Padaria',
    brand: 'Oreo',
    unit: 'un',
    averagePrice: 3.90,
    barcode: '7891234567912',
    description: 'Biscoito recheado de chocolate, pacote 130g',
    active: true
  },
  {
    name: 'Bolo de Chocolate',
    category: 'Padaria',
    brand: 'Padaria Local',
    unit: 'kg',
    averagePrice: 15.00,
    barcode: '7891234567913',
    description: 'Bolo de chocolate caseiro, por kg',
    active: true
  },
  {
    name: 'Torta de Frango',
    category: 'Padaria',
    brand: 'Padaria Local',
    unit: 'un',
    averagePrice: 8.50,
    barcode: '7891234567914',
    description: 'Torta de frango caseira, unidade',
    active: true
  }
];
