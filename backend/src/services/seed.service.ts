import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SeedService {
  constructor(private readonly db: DataSource) {}

  async reset() {
    // Restaurar los 8 perfiles principales de demostración en PoluxImportDB a sus etapas originales
    await this.db.query(`
      UPDATE core.persona SET etapa_actual = 'BUYER',    fecha_actualizacion = SYSDATETIME() WHERE id_persona IN (1, 6);
      UPDATE core.persona SET etapa_actual = 'LEADS',    fecha_actualizacion = SYSDATETIME() WHERE id_persona IN (2, 7);
      UPDATE core.persona SET etapa_actual = 'PAYER',    fecha_actualizacion = SYSDATETIME() WHERE id_persona IN (3, 8);
      UPDATE core.persona SET etapa_actual = 'CUSTOMER', fecha_actualizacion = SYSDATETIME() WHERE id_persona = 4;
      UPDATE core.persona SET etapa_actual = 'TURNED',   fecha_actualizacion = SYSDATETIME() WHERE id_persona = 5;

      UPDATE PoluxImportMart.dbo.DimPersona
      SET EtapaActual = p.etapa_actual
      FROM PoluxImportMart.dbo.DimPersona d
      JOIN PoluxImportDB.core.persona p ON p.id_persona = d.idPersona
      WHERE p.id_persona <= 8;
    `);
    return { ok: true, database: 'PoluxImportDB', mart: 'PoluxImportMart' };
  }
}
