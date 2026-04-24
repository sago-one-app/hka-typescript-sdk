# Auditoría HKA — The Factory HKA Panamá (DGI / FEL)
# Índice Maestro

> **Propósito**: Este conjunto de documentos sirve como guía de auditoría técnica para que
> un agente de código verifique que cualquier implementación de integración con el PAC
> The Factory HKA cumple correctamente con la documentación oficial.
>
> **Fuente de verdad**: `../` (hka_wiki — extraída el 20 de abril de 2026)
> **Protocolo**: SOAP sobre HTTPS
> **Lenguaje de integración objetivo**: TypeScript / Next.js (Sago One)

---

## Orden de ejecución de las etapas

| Etapa | Archivo | Área auditada | Prioridad |
|---|---|---|---|
| 1 | `01_autenticacion_y_entornos.md` | Credenciales, URLs, ambientes | 🔴 Crítica |
| 2 | `02_catalogos_y_codigos.md` | Catálogos de códigos y enumeraciones | 🔴 Crítica |
| 3 | `03_construccion_xml_enviar.md` | Método `Enviar()` — estructura XML | 🔴 Crítica |
| 4 | `04_reglas_condicionales_negocio.md` | Reglas cross-field y condicionales | 🔴 Crítica |
| 5 | `05_calculos_fiscales.md` | Fórmulas ITBMS, totales, redondeo | 🔴 Crítica |
| 6 | `06_metodos_secundarios.md` | Otros 8 métodos del WS | 🟡 Alta |
| 7 | `07_casos_prueba_minimos_fel.md` | 14 casos de prueba obligatorios DGI | 🟡 Alta |

---

## Instrucciones para el agente de código

1. **Ejecuta las etapas en orden**. Cada etapa puede encontrar bugs que afectan las siguientes.
2. **Por cada punto de verificación** marca: ✅ CUMPLE / ❌ FALLA / ⚠️ PARCIAL / 🔍 NO ENCONTRADO.
3. **Si algo FALLA**: documenta el archivo exacto, la línea, y el valor encontrado vs. el esperado.
4. **No modifiques nada** hasta completar el diagnóstico completo de todas las etapas.
5. Al terminar todas las etapas genera un **Reporte Final** en `08_reporte_final.md` con todos los hallazgos.

---

## Mapa de archivos clave a inspeccionar

Cuando el agente analice un proyecto, debe buscar (no limitado a):

```
Candidatos típicos a inspeccionar:
- **/hka*.ts, **/hka*.service.ts
- **/soap*.ts, **/xml*.ts
- **/invoice*.ts, **/factura*.ts
- **/types.ts, **/catalogs.ts
- **/validators*.ts, **/mappers*.ts
- **/enviar*.ts, **/send*.ts
- Cualquier constante con valores 01-10 relacionados a tipoDocumento
- Cualquier constante con valores 00-03 relacionados a tasaITBMS
```

---

## Resumen de lo que cubre la auditoría

```
SOAP WS: https://[ambiente].thefactoryhka.com.pa/ws/obj/v1.0/Service.svc

Métodos auditados (9 total):
  1. Enviar()              ← El más crítico. Construye y envía el DocumentoElectronico
  2. EstadoDocumento()     ← Consulta estado de un documento
  3. AnulacionDocumento()  ← Anulación (ojo: nombre real ≠ nombre wiki)
  4. DescargaXML()         ← Descarga el XML firmado
  5. FoliosRestantes()     ← Consulta folios disponibles en la licencia
  6. EnvioCorreo()         ← Envía documento por correo
  7. DescargaPDF()         ← Descarga el CAFE en PDF
  8. RastreoCorreo()       ← Traza de envíos de correo
  9. ConsultarRucDV()      ← Consulta DV del RUC y estado de afiliación FE
```
