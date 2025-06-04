// Decodificar URL da Infinitepay para análise

const url = "https://checkout.infinitepay.io/rotadoscelulares?items=%5B%7B%22name%22%3A%22Produto+Teste%22%2C%22price%22%3A10000%2C%22quantity%22%3A1%7D%2C%7B%22name%22%3A%22Frete%22%2C%22price%22%3A1550%2C%22quantity%22%3A1%7D%5D&order_nsu=407_1748808094991&redirect_url=https%3A%2F%2Frota.rotadoscelulares.com%2Fconfirmacao%2Finfinitepay%3Forder%3D407&customer_name=Jo%C3%A3o+Silva&customer_email=teste%40exemplo.com&customer_cellphone=11999999999&address_cep=01234567&address_complement=Apto+45";

const urlObj = new URL(url);
const params = new URLSearchParams(urlObj.search);

console.log('🔍 ANÁLISE DA URL INFINITEPAY:');
console.log('=' * 50);

console.log('\n📍 Base URL:', urlObj.origin + urlObj.pathname);
console.log('🏷️ Handle:', urlObj.pathname.substring(1)); // Remove a barra inicial

console.log('\n📋 PARÂMETROS DECODIFICADOS:');
for (const [key, value] of params.entries()) {
    console.log(`${key}:`, decodeURIComponent(value));
}

console.log('\n📦 ITENS DECODIFICADOS:');
const itemsJson = decodeURIComponent(params.get('items'));
const items = JSON.parse(itemsJson);
console.log(JSON.stringify(items, null, 2));

console.log('\n💰 ANÁLISE DE PREÇOS:');
items.forEach((item, index) => {
    console.log(`Item ${index + 1}: ${item.name}`);
    console.log(`  Preço: ${item.price} centavos = R$ ${(item.price / 100).toFixed(2)}`);
    console.log(`  Quantidade: ${item.quantity}`);
    console.log(`  Total: R$ ${(item.price * item.quantity / 100).toFixed(2)}`);
});

const totalCentavos = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
console.log(`\n💵 TOTAL GERAL: ${totalCentavos} centavos = R$ ${(totalCentavos / 100).toFixed(2)}`);

console.log('\n🔗 URL DE REDIRECIONAMENTO:');
console.log(decodeURIComponent(params.get('redirect_url')));
