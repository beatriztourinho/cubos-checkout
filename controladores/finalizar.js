const fs = require('fs/promises');

let index = 0;
let estoqueZerado = 0;

const finalizarCompra = async (req, res) => {
    const tipo = req.body.type;
    const pais = req.body.country;
    const nome = req.body.name.split(" ").filter(x => x!=="");
    const { type, number } = req.body.documents[0];

    console.log(number.length);

    if(tipo.toLowerCase() !== "individual"){
        return res.status(400).json({mensagem: "Este e-commerce só atende pessoas físicas, por favor altere o campo type para 'individual'."});
    }

    if(pais.length !== 2 || Number(pais)){
        return res.status(400).json({mensagem: "Por favor, insira um país válido."});
    }

    if(nome.length < 2){
        return res.status(400).json({mensagem: "Por favor, insira nome e sobrenome."});
    }

    if(type.toLowerCase() !== "cpf"){
        return res.status(400).json({mensagem: "Este e-commerce só atende pessoas físicas, por favor altere o campo type para 'cpf'."});
    }

    if(number.length !== 11 || !Number(number)){
        return res.status(400).json({mensagem: "Por favor, insira um CPF válido."});
    }

    const listaProdutos = await fs.readFile('../cubos-checkout/data.json').then((resposta) =>{
        const produtos = JSON.parse(resposta);
        return produtos;
    })

    try {
        const infoCarrinho = await fs.readFile('../cubos-checkout/carrinho.json').then((resposta) => {
            const carrinho = JSON.parse(resposta);
            const produtosCarrinho = carrinho.produtos;
            for(const produto of listaProdutos.produtos){
                index++;
                for(const noCarrinho of produtosCarrinho){
                    if(produto.id === noCarrinho.id){
                        if(noCarrinho.quantidade > produto.estoque){
                            estoqueZerado++;
                            return res.status(200).json(`Sem estoque suficiente do produto ${noCarrinho.nome}`);
                        } else {
                            listaProdutos.produtos[index-1].estoque = produto.estoque - noCarrinho.quantidade;
                        }
                    }
                }
            } if(!estoqueZerado){
                console.log(`Sua compra foi realizada com sucesso!`, carrinho);
                res.status(200).json({mensagem: "Sua compra foi realizada com sucesso!", carrinho});
                fs.unlink('../cubos-checkout/carrinho.json');
                fs.writeFile("data.json", JSON.stringify(listaProdutos, null, 2));
            }
        })
    } catch (error) {
        res.status(200).json({mensagem: "O carrinho está vazio."});
    }
}

module.exports = {finalizarCompra}