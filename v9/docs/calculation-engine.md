# Motor matemático V9

O motor da V9 é independente da interface React. A tela coleta dados; o diretório `src/engine` valida e calcula.

## 1. Área

### m² direto
`A = área informada`

### Retângulo
`A = comprimento × largura`

### Perímetro × altura
`A = perímetro × altura`

### Margem de perda
`A_compra = A × (1 + perda/100)`

A margem aceita inicialmente valores de 0% a 50%.

## 2. Reservatório retangular

- piso: `C × L`
- paredes: `2 × C × H + 2 × L × H`
- teto opcional: `C × L`
- volume: `C × L × H`
- capacidade: `volume × 1000` litros

## 3. Reservatório cilíndrico

- piso: `π × r²`
- paredes: `π × D × H`
- teto opcional: `π × r²`
- volume: `π × r² × H`

## 4. Consumo

Para consumo por área:

- mínimo: `área_com_perda × consumo_mínimo`
- máximo: `área_com_perda × consumo_máximo`

Quando a ficha/sistema informa uma faixa, o limite máximo é a referência para compra.

## 5. Embalagens

Cada embalagem é convertida para uma unidade-base inteira antes do arredondamento, reduzindo erros de ponto flutuante.

`embalagens = ceil(necessidade / conteúdo_da_embalagem)`

O motor apresenta:

- quantidade mínima de embalagens;
- quantidade máxima/recomendada;
- compra total;
- sobra estimada;
- combinação de tamanhos com menor sobra quando houver mais de uma embalagem compatível.

## 6. Primeiro sistema funcional

### Reservatório enterrado — TOP + TOP FLEX FIBRAS

O banco V9 possui uma composição específica com duas camadas. O cálculo do sistema usa os consumos registrados no próprio `systems.json`, mantendo a regra do sistema separada da regra geral do produto.

### IMPERTUDO TOP direto

Quando TOP é escolhido como impermeabilizante principal, a tela usa as regras técnicas cadastradas no registro do produto:

- umidade de solo/percolação;
- pressão positiva;
- pressão negativa.

## Regra de segurança

Produto com `technicalStatus = pending` não pode alimentar cálculo automático. O motor lança erro em vez de presumir consumo.

## Testes iniciais

Os testes automatizados cobrem:

- área retangular;
- reservatório retangular;
- reservatório cilíndrico;
- arredondamento de embalagens;
- combinação com menor sobra;
- sistema enterrado TOP + TOP FLEX FIBRAS;
- TOP direto sob pressão negativa.
