const fs = require('fs/promises');
const addBusinessDays = require('date-fns/addBusinessDays');
const format = require('date-fns/format');

let noCarrinho = 0;
let qtdZero = 0;
let index = 0;
let idFound = 0;
let addCarrinho;

const carrinho = {
    subtotal: 0,
    dataDeEntrega: null,
    valorDoFrete: 0,
    totalAPagar: 0,
    produtos: []
}
const carrinhoSet = carrinho;

const mostrarCarrinho = async (req, res) => {
    try {
        const infoCarrinho = await fs.readFile('../cubos-checkout/carrinho.json').then((resposta) => {
        const carrinho = JSON.parse(resposta);
        return res.status(200).json(carrinho);
        })
    } catch (error) {
        res.status(200).json(carrinho);
    }
    
}

const addProdutos = async (req,res) => {
    const id = req.body.id;  
    const qtd = req.body.quantidade;
    if(!id){
        return res.status(400).json({mensagem: "Por favor, insira o ID do produto."});
    }

    if(!qtd || qtd <=0){
        return res.status(400).json({mensagem: "Por favor, insira a quantidade do produto."});
    }

    const listaProdutos = await fs.readFile('../cubos-checkout/data.json').then((resposta) =>{
        const produtos = JSON.parse(resposta);
        return produtos.produtos;
    })

    const found = listaProdutos.find(produto => id === produto.id);

    if (!found){
        res.status(404).json({mensagem: "Produto não encontrado"});
    } else {
        addCarrinho = found;
    }

    if(addCarrinho.estoque < qtd || addCarrinho.estoque===0){
        return res.status(200).json({mensagem: "Produto sem estoque suficiente."});
    }

    try {
        const infoCarrinho = await fs.readFile('../cubos-checkout/carrinho.json').then((resposta) => {
        const carrinho = JSON.parse(resposta);
        const produtosCarrinho = carrinho.produtos;
        for (const produto of produtosCarrinho){
            if(produto.id === id){
                if(produto.quantidade+qtd > addCarrinho.estoque){
                    res.status(200).json({mensagem: "Produto sem estoque suficiente."});
                } else {
                    noCarrinho++;
                    produto.quantidade+=qtd;
                    carrinho.subtotal += addCarrinho.preco*qtd;
                    carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
                    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
                }
            }
        }
        if(addCarrinho.estoque >= qtd && addCarrinho.estoque !== 0 && noCarrinho === 0){
            carrinho.subtotal += addCarrinho.preco*qtd;
            carrinho.dataDeEntrega =  format(addBusinessDays(new Date(), 15), "dd-MM-yyyy");
            carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
            carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
            Object.defineProperty(addCarrinho, 'quantidade', {configurable: true, writable: true, value: qtd, enumerable: true});
            delete addCarrinho.estoque;
            carrinho.produtos.push(addCarrinho);
        }
        const novoConteudo = JSON.stringify(carrinho, null, 2);
        res.status(201).json(JSON.parse(novoConteudo));
        fs.writeFile("carrinho.json", novoConteudo)
        })
    } catch (error) {
        if(addCarrinho.estoque >= qtd && addCarrinho.estoque !== 0){
            carrinho.subtotal += addCarrinho.preco*qtd;
            carrinho.dataDeEntrega =  format(addBusinessDays(new Date(), 15), "dd-MM-yyyy");
            carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
            carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
            Object.defineProperty(addCarrinho, 'quantidade', {configurable: true, writable: true, value: qtd, enumerable: true});
            delete addCarrinho.estoque;
            carrinho.produtos.push(addCarrinho);
        }     
        const novoConteudo = JSON.stringify(carrinho, null, 2);
        res.status(201).json(JSON.parse(novoConteudo));
        fs.writeFile("carrinho.json", novoConteudo)
    }
}

const atualizarCarrinho = async (req,res) => {
    const id = Number(req.params.idProduto);
    const qtd = req.body.quantidade;
    if(id <= 0){
        res.status(400).json({mensagem: "Produto inexistente."});
    }
    const listaProdutos = await fs.readFile('../cubos-checkout/data.json').then((resposta) =>{
        const produtos = JSON.parse(resposta);
        return produtos.produtos;
    })

    const addCarrinho = listaProdutos.find(produto => id === produto.id);

    try {
        const infoCarrinho = await fs.readFile('../cubos-checkout/carrinho.json').then((resposta) => {
            const carrinho = JSON.parse(resposta);
            const produtosCarrinho = carrinho.produtos;
            for (const temProduto of produtosCarrinho){
                if(!idFound){
                    index++;
                }
                if(temProduto.id === id){
                    idFound++;
                    if(temProduto.quantidade+qtd > addCarrinho.estoque){
                        res.status(200).json({mensagem: "Produto sem estoque suficiente."});
                    } else if (temProduto.quantidade+qtd < 0){
                        res.status(400).json({mensagem: "Por favor, insira uma quantidade válida."});
                    } else if(temProduto.quantidade+qtd === 0){
                        qtdZero++;
                    } else {
                        temProduto.quantidade+=qtd;
                        carrinho.subtotal += addCarrinho.preco*qtd;
                        carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
                        carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
                    }
                }
            } 
            if(!idFound){
                res.status(400).json({mensagem: "O produto adicionado não existe."});
            }
            if(qtdZero > 0){
                qtdZero = 0;
                carrinho.subtotal += addCarrinho.preco*qtd;
                carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
                carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
                carrinho.produtos.splice(index-1, 1);
            }
            if(!carrinho.produtos.length){
                fs.unlink('../cubos-checkout/carrinho.json');
                res.status(200).json(carrinhoSet);
            }
            const novoConteudoCarrinho = JSON.stringify(carrinho, null, 2);
            res.status(201).json(JSON.parse(novoConteudoCarrinho));
            fs.writeFile("carrinho.json", novoConteudoCarrinho)
            })
        } catch (error) {
            res.status(400).json({mensagem: "O produto adicionado não existe."});
        }     
}

const deleteItem = async (req,res) => {
    const id = Number(req.params.idProduto);
    try {
        const infoCarrinho = await fs.readFile('../cubos-checkout/carrinho.json').then((resposta) => {
            const carrinho = JSON.parse(resposta);
            const produtosCarrinho = carrinho.produtos;
            for (const produto of produtosCarrinho){
                index++;
                if(produto.id === id){
                    idFound++;
                    carrinho.subtotal -= produto.preco*produto.quantidade;
                    carrinho.valorDoFrete = carrinho.subtotal >= 20000 ? 0 : 5000;
                    carrinho.totalAPagar = carrinho.subtotal + carrinho.valorDoFrete;
                    carrinho.produtos.splice(index-1, 1);
            }}
            if(!idFound){
                index = 0;
                res.status(400).json({mensagem: "Produto não encontrado no carrinho."});
            }
            if(!carrinho.produtos.length){
                fs.unlink('../cubos-checkout/carrinho.json');
                res.status(200).json(carrinhoSet);
            }
            const novoConteudoCarrinho = JSON.stringify(carrinho, null, 2);
            res.status(201).json(JSON.parse(novoConteudoCarrinho));
            fs.writeFile("carrinho.json", novoConteudoCarrinho)
            })
        } catch (error) {
            console.log("o erro é", error);
            res.status(400).json({mensagem: "O carrinho está vazio, nenhum item a ser excluído."});
        }     
}

const limparCarrinho = async (req,res) => {
    fs.unlink('../cubos-checkout/carrinho.json');
    res.status(200).json({mensagem: "Seu carrinho foi zerado com sucesso"});
}

module.exports = {mostrarCarrinho, addProdutos, atualizarCarrinho, deleteItem, limparCarrinho}