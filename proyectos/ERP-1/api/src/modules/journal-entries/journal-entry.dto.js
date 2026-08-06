export class JournalEntryResponseDTO {
  constructor(e) {
    this.id = e.id;
    this.companyId = e.companyId;
    this.entryNumber = e.entryNumber;
    this.description = e.description;
    this.entryDate = e.entryDate;
    this.totalDebit = Number(e.totalDebit);
    this.totalCredit = Number(e.totalCredit);
    this.referenceType = e.referenceType;
    this.referenceId = e.referenceId;
    this.status = e.status;
    this.createdAt = e.createdAt;
    this.createdBy = e.createdBy;
    if (e.lines) this.lines = e.lines.map((l) => new JournalLineResponseDTO(l));
  }
}

class JournalLineResponseDTO {
  constructor(l) {
    this.id = l.id;
    this.accountId = l.accountId;
    this.debit = Number(l.debit);
    this.credit = Number(l.credit);
    this.description = l.description;
    if (l.account) {
      this.account = { id: l.account.id, code: l.account.code, name: l.account.name };
    }
  }
}
