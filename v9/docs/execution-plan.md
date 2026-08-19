# Plano de execução — Calculadora Técnica IMPERTUDO V9.0

A V9 é desenvolvida em fluxo contínuo. Cada etapa só é considerada concluída quando banco, testes, TypeScript e build permanecem verdes.

## Ordem do projeto

1. **Arquitetura e banco técnico** — concluído
   - React + TypeScript + Vite + Zod;
   - catálogo mestre versionado;
   - status de verificação e fontes;
   - produtos sem base técnica suficiente bloqueados do cálculo automático.

2. **Motor matemático** — concluído
   - área direta, retângulo e perímetro × altura;
   - reservatórios retangulares e cilíndricos;
   - consumo mínimo/máximo;
   - margem de perda;
   - embalagens e combinação com menor sobra.

3. **Modo Projeto / Obra** — concluído
   - cliente, obra, local, responsável e validade;
   - múltiplos cálculos na mesma obra;
   - persistência no navegador.

4. **Cálculo genérico por produto** — concluído para modelos com dados liberados
   - consumo por área/faixa;
   - rendimento m²/L;
   - perfis de aplicação;
   - manta em rolo;
   - juntas quando a ficha estiver revalidada;
   - produtos pendentes continuam bloqueados.

5. **Cálculo por sistema** — concluído
   - motor por camadas;
   - consumo e embalagem de cada componente;
   - inclusão no Projeto/Obra.

6. **Assistente técnico** — concluído
   - filtro por ambiente;
   - pressão negativa, UV, água potável e disponibilidade de cálculo;
   - somente relações cadastradas no banco.

7. **Consolidação de materiais** — concluído
   - soma por produto antes de arredondar embalagens;
   - combinação de embalagens com menor sobra.

8. **Orçamento e proposta** — concluído
   - preço por embalagem;
   - desconto comercial por item em % ou R$;
   - desconto adicional PIX/Dinheiro;
   - cartão sem desconto adicional à vista;
   - WhatsApp e resumo copiável.

9. **PDF** — concluído
   - quantitativo consolidado;
   - linhas comerciais;
   - totais e condições;
   - observação e aviso técnico.

10. **Persistência / PWA / offline** — concluído
    - localStorage para a obra;
    - manifesto;
    - Service Worker seguro;
    - orientação de instalação Android/iOS.

11. **UX responsiva** — concluído para homologação
    - desktop, tablet e mobile;
    - logo original IMPERTUDO preservada;
    - navegação em módulos.

12. **Testes e homologação** — em execução contínua
    - validação do banco;
    - testes unitários do motor;
    - TypeScript;
    - build Vite;
    - presença dos arquivos PWA no pacote;
    - Preview Vercel antes de qualquer promoção à produção.

## Regra de publicação

`v9-main → PR de desenvolvimento → CI verde → Preview Vercel → homologação → promoção controlada`

A V8.3 permanece como produção até a V9 ser explicitamente promovida.
