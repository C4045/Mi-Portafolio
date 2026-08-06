export class CategoryResponseDTO {
  constructor(category) {
    this.id = category.id;
    this.companyId = category.companyId;
    this.parentId = category.parentId;
    this.code = category.code;
    this.name = category.name;
    this.description = category.description;
    this.isActive = category.isActive;
    this.sortOrder = category.sortOrder;
    this.createdAt = category.createdAt;
    this.updatedAt = category.updatedAt;
    this.childrenCount = category._count?.children ?? category.children?.length ?? 0;
    this.productsCount = category._count?.products ?? category.products?.length ?? 0;
  }
}

export class CreateCategoryDTO {
  constructor(data) {
    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.parentId = data.parentId || null;
    this.sortOrder = data.sortOrder || 0;
  }
}

export class UpdateCategoryDTO {
  constructor(data) {
    if (data.code !== undefined) this.code = data.code;
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description;
    if (data.parentId !== undefined) this.parentId = data.parentId || null;
    if (data.sortOrder !== undefined) this.sortOrder = data.sortOrder;
    if (data.isActive !== undefined) this.isActive = data.isActive;
  }
}
