const fs = require('fs/promises');

const listarProdutos = async (req, res) => {
    const listaProdutos = await fs.readFile('../cubos-checkout/data.json').then((resposta) =>{
        const produtos = JSON.parse(resposta);
        return produtos.produtos;
    })
    
    const {categoria, precoInicial, precoFinal} = req.query;
    
    if(categoria && !precoInicial && !precoFinal){
        const produtosCategoria = listaProdutos.filter(categoriaFiltrada => categoriaFiltrada.categoria.toLowerCase() === categoria.toLowerCase()).filter(estoque => estoque.estoque !== 0);
        if(!produtosCategoria[0]){
            res.status(404).json({mensagem: "Produto inexistente."});
        }
        res.status(200).json(produtosCategoria);
    }

    if(precoFinal && precoInicial){
        if(categoria){
            const produtosCategoria2 = listaProdutos.filter(categoriaFiltrada => categoriaFiltrada.categoria.toLowerCase() === categoria.toLowerCase()).filter(estoque => estoque.estoque !== 0).filter(produto => produto.preco >= Number(precoInicial) && produto.preco <= Number(precoFinal));
            if(!produtosCategoria2[0]){
                res.status(404).json({mensagem: "Produto inexistente."});
            }
            res.status(200).json(produtosCategoria2);
        }
        const precoProdutos = listaProdutos.filter(produto => produto.preco >= Number(precoInicial) && produto.preco <= Number(precoFinal));
            if(!precoProdutos[0]){
                res.status(404).json({mensagem: "Não existem produtos nesta faixa de preço."});
            }
        res.status(200).json(precoProdutos);
    }

    const produtosAll = listaProdutos.filter(produto => produto.estoque > 0);
    res.status(200).json(produtosAll);
}

module.exports = {listarProdutos}