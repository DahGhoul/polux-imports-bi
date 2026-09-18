/*
  POLUX_DW - Modelo dimensional propuesto para el curso de Inteligencia de Negocios.
  Este script NO es necesario para levantar la demo operacional. Sirve como siguiente capa BI.
*/
IF DB_ID(N'POLUX_DW') IS NULL CREATE DATABASE POLUX_DW;
GO
USE POLUX_DW;
GO

IF OBJECT_ID('dbo.DimDate') IS NULL
CREATE TABLE dbo.DimDate(
  DateKey INT PRIMARY KEY,
  FullDate DATE NOT NULL,
  YearNumber SMALLINT NOT NULL,
  MonthNumber TINYINT NOT NULL,
  MonthName NVARCHAR(20) NOT NULL,
  DayNumber TINYINT NOT NULL
);
GO

IF OBJECT_ID('dbo.DimPerson') IS NULL
CREATE TABLE dbo.DimPerson(
  PersonKey INT IDENTITY PRIMARY KEY,
  PersonIdOLTP INT NOT NULL,
  City NVARCHAR(80),
  AgeRange NVARCHAR(20),
  SocioeconomicLevel NVARCHAR(10),
  Occupation NVARCHAR(120),
  PreferredChannel NVARCHAR(30),
  AcquisitionSource NVARCHAR(60),
  EffectiveFrom DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
  EffectiveTo DATETIME2 NULL,
  IsCurrent BIT NOT NULL DEFAULT 1
);
GO

IF OBJECT_ID('dbo.DimProduct') IS NULL
CREATE TABLE dbo.DimProduct(
  ProductKey INT IDENTITY PRIMARY KEY,
  ProductName NVARCHAR(140) NOT NULL UNIQUE
);
GO

IF OBJECT_ID('dbo.DimFunnelStage') IS NULL
CREATE TABLE dbo.DimFunnelStage(
  FunnelStageKey INT IDENTITY PRIMARY KEY,
  StageCode NVARCHAR(20) NOT NULL UNIQUE,
  StageOrder TINYINT NOT NULL
);
GO

IF OBJECT_ID('dbo.FactInteraction') IS NULL
CREATE TABLE dbo.FactInteraction(
  InteractionFactKey BIGINT IDENTITY PRIMARY KEY,
  PersonKey INT NOT NULL,
  ProductKey INT NULL,
  DateKey INT NOT NULL,
  FunnelStageKey INT NOT NULL,
  IntentPoints INT NOT NULL DEFAULT 0,
  InteractionCount INT NOT NULL DEFAULT 1,
  CONSTRAINT FK_FI_Person FOREIGN KEY(PersonKey) REFERENCES dbo.DimPerson(PersonKey),
  CONSTRAINT FK_FI_Product FOREIGN KEY(ProductKey) REFERENCES dbo.DimProduct(ProductKey),
  CONSTRAINT FK_FI_Date FOREIGN KEY(DateKey) REFERENCES dbo.DimDate(DateKey),
  CONSTRAINT FK_FI_Stage FOREIGN KEY(FunnelStageKey) REFERENCES dbo.DimFunnelStage(FunnelStageKey)
);
GO

IF OBJECT_ID('dbo.FactFunnelTransition') IS NULL
CREATE TABLE dbo.FactFunnelTransition(
  TransitionFactKey BIGINT IDENTITY PRIMARY KEY,
  PersonKey INT NOT NULL,
  DateKey INT NOT NULL,
  FromStageKey INT NOT NULL,
  ToStageKey INT NOT NULL,
  TransitionCount INT NOT NULL DEFAULT 1,
  CONSTRAINT FK_FT_Person FOREIGN KEY(PersonKey) REFERENCES dbo.DimPerson(PersonKey)
);
GO
