const express = require('express');
const produtos = require('./controladores/produtos');
const carrinho = require('./controladores/carrinho'); 
const finalizar = require('./controladores/finalizar');
const roteador = express();


roteador.get('/produtos', produtos.listarProdutos);
roteador.get('/carrinho', carrinho.mostrarCarrinho);
roteador.post('/carrinho/produtos', carrinho.addProdutos);
roteador.patch('/carrinho/produtos/:idProduto', carrinho.atualizarCarrinho);
roteador.delete('/carrinho/produtos/:idProduto', carrinho.deleteItem);
roteador.delete('/carrinho', carrinho.limparCarrinho);
roteador.post('/finalizar-compra', finalizar.finalizarCompra);


module.exports = roteador;