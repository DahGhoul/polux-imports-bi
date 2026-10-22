/* =====================================================================
   09_reparar_codificacion_utf8.sql
   Repara textos con "mojibake" (ej. 'SebastiÃ¡n' -> 'Sebastián') generados
   al ejecutar scripts con sqlcmd sin la opción -f 65001.
   Recorre TODAS las columnas NVARCHAR/NCHAR de PoluxImportDB y PoluxImportMart.
   Recomendación: en adelante ejecutar con  sqlcmd -S localhost -E -I -f 65001 -i archivo.sql
   ===================================================================== */
SET NOCOUNT ON;
GO
DECLARE @dbs TABLE(n SYSNAME); INSERT @dbs VALUES (N'PoluxImportDB'),(N'PoluxImportMart');
DECLARE @db SYSNAME, @sql NVARCHAR(MAX);
DECLARE cdb CURSOR LOCAL FAST_FORWARD FOR SELECT n FROM @dbs;
OPEN cdb; FETCH NEXT FROM cdb INTO @db;
WHILE @@FETCH_STATUS = 0
BEGIN
  SET @sql = N'USE ' + QUOTENAME(@db) + N';
  IF OBJECT_ID(''dbo.fn_fix_utf8'') IS NOT NULL DROP FUNCTION dbo.fn_fix_utf8;';
  EXEC (@sql);
  SET @sql = N'USE ' + QUOTENAME(@db) + N'; EXEC(N''
  CREATE FUNCTION dbo.fn_fix_utf8(@s NVARCHAR(MAX)) RETURNS NVARCHAR(MAX) AS
  BEGIN
    IF @s IS NULL RETURN NULL;
    DECLARE @i INT = 1, @n INT = LEN(@s + N''''x'''') - 1, @c INT, @b VARBINARY(MAX) = 0x;
    WHILE @i <= @n
    BEGIN
      SET @c = UNICODE(SUBSTRING(@s, @i, 1));
      IF @c > 255 RETURN @s;            -- ya es Unicode real: no tocar
      SET @b = @b + CAST(@c AS BINARY(1));
      SET @i += 1;
    END
    DECLARE @r NVARCHAR(MAX) = CAST(CAST(@b AS VARCHAR(MAX)) COLLATE Latin1_General_100_CI_AS_SC_UTF8 AS NVARCHAR(MAX));
    IF CHARINDEX(NCHAR(65533), @r) > 0 RETURN @s;  -- no era UTF-8 válido
    RETURN @r;
  END'')';
  EXEC (@sql);

  /* Genera UPDATE por cada columna de texto con posibles bytes UTF-8 mal leídos */
  DECLARE @upd NVARCHAR(MAX) = N'';
  SET @sql = N'USE ' + QUOTENAME(@db) + N';
  SELECT @o = STRING_AGG(CAST(
    N''BEGIN TRY ALTER TABLE '' + QUOTENAME(s.name) + N''.'' + QUOTENAME(t.name) + N'' DISABLE TRIGGER ALL; '' +
    N''UPDATE '' + QUOTENAME(s.name) + N''.'' + QUOTENAME(t.name) + N'' SET '' + QUOTENAME(c.name) + N'' = dbo.fn_fix_utf8('' + QUOTENAME(c.name) + N'') '' +
    N''WHERE '' + QUOTENAME(c.name) + N'' LIKE N''''%['' + NCHAR(194) + NCHAR(195) + NCHAR(226) + NCHAR(240) + N'']%'''' COLLATE Latin1_General_100_BIN2; '' +
    N''ALTER TABLE '' + QUOTENAME(s.name) + N''.'' + QUOTENAME(t.name) + N'' ENABLE TRIGGER ALL; END TRY BEGIN CATCH PRINT ERROR_MESSAGE(); END CATCH;'' AS NVARCHAR(MAX)), CHAR(10))
  FROM sys.columns c
  JOIN sys.tables t ON t.object_id = c.object_id
  JOIN sys.schemas s ON s.schema_id = t.schema_id
  JOIN sys.types ty ON ty.user_type_id = c.user_type_id
  WHERE ty.name IN (''nvarchar'',''nchar'') AND c.is_computed = 0;';
  EXEC sp_executesql @sql, N'@o NVARCHAR(MAX) OUTPUT', @o = @upd OUTPUT;
  SET @upd = N'USE ' + QUOTENAME(@db) + N'; ' + ISNULL(@upd, N'');
  EXEC (@upd);
  PRINT 'Codificación reparada en ' + @db;
  FETCH NEXT FROM cdb INTO @db;
END
CLOSE cdb; DEALLOCATE cdb;
GO
