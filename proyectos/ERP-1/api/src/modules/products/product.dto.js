export class ProductResponseDTO {
  constructor(product) {
    this.id = product.id;
    this.companyId = product.companyId;
    this.categoryId = product.categoryId;
    this.unitTypeId = product.unitTypeId;
    this.sku = product.sku;
    this.barcode = product.barcode;
    this.name = product.name;
    this.description = product.description;
    this.productType = product.productType;
    this.costPrice = Number(product.costPrice);
    this.salePrice = Number(product.salePrice);
    this.minStock = Number(product.minStock);
    this.maxStock = Number(product.maxStock);
    this.currentStock = Number(product.currentStock);
    this.isActive = product.isActive;
    this.hasIva = product.hasIva;
    this.ivaPercentage = Number(product.ivaPercentage);
    this.imageUrl = product.imageUrl;
    this.weight = product.weight ? Number(product.weight) : null;
    this.volume = product.volume ? Number(product.volume) : null;
    this.isTracked = product.isTracked;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
    this.category = product.category ? { id: product.category.id, name: product.category.name, code: product.category.code } : null;
    this.unitType = product.unitType ? { id: product.unitType.id, code: product.unitType.code, name: product.unitType.name } : null;
    this.stockStatus = this._getStockStatus(Number(product.currentStock), Number(product.minStock));
  }

  _getStockStatus(stock, min) {
    if (stock <= 0) return 'out_of_stock';
    if (stock <= min) return 'low';
    return 'healthy';
  }
}

export class CreateProductDTO {
  constructor(data) {
    this.sku = data.sku;
    this.name = data.name;
    this.categoryId = data.categoryId || null;
    this.unitTypeId = data.unitTypeId;
    this.barcode = data.barcode || null;
    this.description = data.description || null;
    this.productType = data.productType || 'product';
    this.costPrice = data.costPrice || 0;
    this.salePrice = data.salePrice || 0;
    this.minStock = data.minStock || 0;
    this.maxStock = data.maxStock || 0;
    this.currentStock = data.currentStock || 0;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.hasIva = data.hasIva !== undefined ? data.hasIva : true;
    this.ivaPercentage = data.ivaPercentage || 10;
    this.imageUrl = data.imageUrl || null;
    this.weight = data.weight || null;
    this.volume = data.volume || null;
    this.isTracked = data.isTracked !== undefined ? data.isTracked : true;
  }
}

export class UpdateProductDTO {
  constructor(data) {
    if (data.sku !== undefined) this.sku = data.sku;
    if (data.name !== undefined) this.name = data.name;
    if (data.categoryId !== undefined) this.categoryId = data.categoryId || null;
    if (data.unitTypeId !== undefined) this.unitTypeId = data.unitTypeId;
    if (data.barcode !== undefined) this.barcode = data.barcode || null;
    if (data.description !== undefined) this.description = data.description || null;
    if (data.productType !== undefined) this.productType = data.productType;
    if (data.costPrice !== undefined) this.costPrice = data.costPrice;
    if (data.salePrice !== undefined) this.salePrice = data.salePrice;
    if (data.minStock !== undefined) this.minStock = data.minStock;
    if (data.maxStock !== undefined) this.maxStock = data.maxStock;
    if (data.isActive !== undefined) this.isActive = data.isActive;
    if (data.hasIva !== undefined) this.hasIva = data.hasIva;
    if (data.ivaPercentage !== undefined) this.ivaPercentage = data.ivaPercentage;
    if (data.imageUrl !== undefined) this.imageUrl = data.imageUrl || null;
    if (data.weight !== undefined) this.weight = data.weight || null;
    if (data.volume !== undefined) this.volume = data.volume || null;
    if (data.isTracked !== undefined) this.isTracked = data.isTracked;
  }
}

export class StockAlertDTO {
  constructor(product) {
    this.id = product.id;
    this.sku = product.sku;
    this.name = product.name;
    this.currentStock = Number(product.currentStock);
    this.minStock = Number(product.minStock);
    this.maxStock = Number(product.maxStock);
    this.salePrice = Number(product.salePrice);
    this.stockStatus = this._getStockStatus(Number(product.currentStock), Number(product.minStock));
    this.category = product.category ? product.category.name : null;
  }

  _getStockStatus(stock, min) {
    if (stock <= 0) return 'out_of_stock';
    if (stock <= min) return 'low';
    return 'healthy';
  }
}
