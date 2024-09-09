export class update {
  public readonly tableName: string;
  public readonly property: string;
  public readonly value: string;
  public readonly identifier: string;
  public readonly identifierValue: string;
}

export class Find {
  public readonly tableName: string;

  public readonly identifier: string;
  public readonly identifierValue: string;
}
