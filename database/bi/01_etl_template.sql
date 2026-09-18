/*
  Plantilla ETL incremental POLUX_OLTP -> POLUX_DW.
  Se deja deliberadamente separada de la demo para que el grupo pueda ajustarla
  al modelo dimensional definitivo del informe.
*/

-- 1) Dimensión de etapas
USE POLUX_DW;
GO
MERGE dbo.DimFunnelStage AS T
USING (VALUES ('BUYER',1),('LEAD',2),('PAYER',3),('CUSTOMER',4),('TURNED',5)) AS S(StageCode,StageOrder)
ON T.StageCode=S.StageCode
WHEN NOT MATCHED THEN INSERT(StageCode,StageOrder) VALUES(S.StageCode,S.StageOrder);
GO

-- 2) Personas actuales (SCD simplificada para demo)
MERGE dbo.DimPerson AS T
USING (
  SELECT id, city,
    CASE WHEN age < 25 THEN '22-24' WHEN age < 30 THEN '25-29' WHEN age < 36 THEN '30-35' ELSE '36+' END AgeRange,
    socioeconomicLevel, occupation, preferredChannel, acquisitionSource
  FROM POLUX_OLTP.dbo.persons
) AS S
ON T.PersonIdOLTP=S.id AND T.IsCurrent=1
WHEN NOT MATCHED THEN
  INSERT(PersonIdOLTP,City,AgeRange,SocioeconomicLevel,Occupation,PreferredChannel,AcquisitionSource)
  VALUES(S.id,S.city,S.AgeRange,S.socioeconomicLevel,S.occupation,S.preferredChannel,S.acquisitionSource);
GO

-- Próximo paso recomendado: cargar DimDate, DimProduct, FactInteraction y FactFunnelTransition
-- usando watermarks por createdAt para una carga incremental.
