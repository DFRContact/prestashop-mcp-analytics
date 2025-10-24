import { ProductSalesStats, TopProductsResult } from '../types.js';
import { formatDateForDisplay } from '../utils/date.utils.js';
import { applyTruncation } from '../utils/truncation.utils.js';

export function formatProductSalesStatsMarkdown(
  stats: ProductSalesStats
): string {
  const lines: string[] = [];

  lines.push(`# Statistiques de vente - ${stats.product_name}`);
  lines.push('');
  lines.push(`**Produit ID:** ${String(stats.product_id)}`);
  lines.push(`**Référence:** ${stats.product_reference}`);
  lines.push(
    `**Période:** ${formatDateForDisplay(stats.period.from)} - ${formatDateForDisplay(
      stats.period.to
    )}`
  );
  lines.push('');

  lines.push('## 📊 Résumé des ventes');
  lines.push('');
  lines.push(`- **Quantité totale vendue:** ${String(stats.sales.total_quantity_sold)} unités`);
  lines.push(
    `- **Revenu total (HT):** ${stats.sales.total_revenue_excl_tax.toFixed(2)} €`
  );
  lines.push(
    `- **Revenu total (TTC):** ${stats.sales.total_revenue_incl_tax.toFixed(2)} €`
  );
  lines.push(
    `- **Prix moyen unitaire:** ${stats.sales.average_unit_price.toFixed(2)} €`
  );
  lines.push(`- **Nombre de commandes:** ${String(stats.sales.number_of_orders)}`);
  lines.push('');

  if (stats.orders.length > 0) {
    lines.push('## 📦 Détails des commandes');
    lines.push('');

    const displayOrders = stats.orders.slice(0, 50); // Limite affichage
    for (const order of displayOrders) {
      lines.push(
        `### Commande #${String(order.order_id)} - ${formatDateForDisplay(order.date)}`
      );
      lines.push(`- Quantité: ${String(order.quantity)} unités`);
      lines.push(`- Prix unitaire: ${order.unit_price.toFixed(2)} €`);
      lines.push(`- Total: ${order.total_price.toFixed(2)} €`);
      lines.push('');
    }

    if (stats.orders.length > 50) {
      lines.push(
        `*... et ${String(stats.orders.length - 50)} autres commandes (affichage limité à 50)*`
      );
      lines.push('');
    }
  } else {
    lines.push('## 📦 Aucune commande');
    lines.push('');
    lines.push('Aucune vente enregistrée pour ce produit sur la période sélectionnée.');
  }

  const markdown = lines.join('\n');
  const result = applyTruncation(markdown);

  if (result.truncated && result.message) {
    return result.data + '\n\n---\n\n' + result.message;
  }

  return markdown;
}

export function formatTopProductsMarkdown(data: TopProductsResult): string {
  const lines: string[] = [];

  const sortLabel =
    data.sort_by === 'quantity' ? 'Quantité Vendue' : "Chiffre d'Affaires";
  lines.push(`# 🏆 Top ${String(data.products.length)} Produits - Par ${sortLabel}`);
  lines.push('');
  lines.push(
    `**Période:** ${formatDateForDisplay(data.period.from)} - ${formatDateForDisplay(
      data.period.to
    )}`
  );
  lines.push(`**Critère:** ${sortLabel}`);
  lines.push('');

  lines.push('## Classement');
  lines.push('');

  const medals = ['🥇', '🥈', '🥉'];

  for (const product of data.products) {
    const medal = product.rank <= 3 ? medals[product.rank - 1] + ' ' : '';
    lines.push(
      `### ${medal}#${String(product.rank)} - ${product.product_name} (ID: ${String(product.product_id)})`
    );
    lines.push(`- **Référence:** ${product.product_reference}`);
    lines.push(`- **Quantité vendue:** ${String(product.total_quantity_sold)} unités`);
    lines.push(
      `- **Revenu (TTC):** ${product.total_revenue_incl_tax.toFixed(2)} €`
    );
    lines.push(`- **Commandes:** ${String(product.number_of_orders)}`);
    lines.push(`- **Prix moyen:** ${product.average_unit_price.toFixed(2)} €`);
    lines.push('');
  }

  lines.push('---');
  lines.push(
    `**Total:** ${String(data.total_products_found)} produits trouvés | Affichage des ${String(data.products.length)} premiers`
  );

  if (data.has_more) {
    lines.push('');
    lines.push(`💡 Pour voir plus de résultats, utilisez \`limit=${String(data.next_limit ?? '')}\``);
  }

  const markdown = lines.join('\n');
  const result = applyTruncation(markdown);

  return result.truncated && result.message ? result.data + '\n\n---\n\n' + result.message : markdown;
}
