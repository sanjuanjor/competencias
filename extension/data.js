// Archivo GENERADO por scripts/build_data.py — no editar a mano.
const COMPETENCIAS = {
 "version": "0.2.0",
 "descripcion": "Matriz de reparto competencial entre Estado, Comunidades Autónomas, Diputaciones y Ayuntamientos en España, con referencia a la norma concreta.",
 "avisos": [
  "Esta matriz refleja el marco general (Constitución, LBRL y leyes sectoriales básicas). Los Estatutos de Autonomía concretan el reparto en cada comunidad; las diferencias más relevantes se recogen como excepciones territoriales.",
  "Contenido divulgativo: la fuente vinculante es siempre el BOE y los boletines oficiales autonómicos."
 ],
 "territorios": [
  {
   "iso": "ES-AN",
   "nombre": "Andalucía",
   "gobierno": "Junta de Andalucía"
  },
  {
   "iso": "ES-AR",
   "nombre": "Aragón",
   "gobierno": "Gobierno de Aragón"
  },
  {
   "iso": "ES-AS",
   "nombre": "Principado de Asturias",
   "gobierno": "Gobierno del Principado de Asturias"
  },
  {
   "iso": "ES-IB",
   "nombre": "Illes Balears",
   "gobierno": "Govern de les Illes Balears"
  },
  {
   "iso": "ES-CN",
   "nombre": "Canarias",
   "gobierno": "Gobierno de Canarias"
  },
  {
   "iso": "ES-CB",
   "nombre": "Cantabria",
   "gobierno": "Gobierno de Cantabria"
  },
  {
   "iso": "ES-CM",
   "nombre": "Castilla-La Mancha",
   "gobierno": "Junta de Comunidades de Castilla-La Mancha"
  },
  {
   "iso": "ES-CL",
   "nombre": "Castilla y León",
   "gobierno": "Junta de Castilla y León"
  },
  {
   "iso": "ES-CT",
   "nombre": "Cataluña",
   "gobierno": "Generalitat de Catalunya"
  },
  {
   "iso": "ES-CE",
   "nombre": "Ceuta",
   "gobierno": "Ciudad Autónoma de Ceuta"
  },
  {
   "iso": "ES-VC",
   "nombre": "Comunitat Valenciana",
   "gobierno": "Generalitat Valenciana"
  },
  {
   "iso": "ES-EX",
   "nombre": "Extremadura",
   "gobierno": "Junta de Extremadura"
  },
  {
   "iso": "ES-GA",
   "nombre": "Galicia",
   "gobierno": "Xunta de Galicia"
  },
  {
   "iso": "ES-RI",
   "nombre": "La Rioja",
   "gobierno": "Gobierno de La Rioja"
  },
  {
   "iso": "ES-MD",
   "nombre": "Comunidad de Madrid",
   "gobierno": "Comunidad de Madrid"
  },
  {
   "iso": "ES-ML",
   "nombre": "Melilla",
   "gobierno": "Ciudad Autónoma de Melilla"
  },
  {
   "iso": "ES-MC",
   "nombre": "Región de Murcia",
   "gobierno": "Gobierno de la Región de Murcia"
  },
  {
   "iso": "ES-NC",
   "nombre": "Comunidad Foral de Navarra",
   "gobierno": "Gobierno de Navarra"
  },
  {
   "iso": "ES-PV",
   "nombre": "País Vasco",
   "gobierno": "Gobierno Vasco"
  }
 ],
 "materias": [
  {
   "id": "educacion",
   "nombre": "Educación",
   "descripcion": "Colegios, institutos, guarderías, profesorado, becas, currículo y escolarización.",
   "tags": [
    "profesores",
    "profesorado",
    "docentes",
    "maestros",
    "becas comedor",
    "comedor escolar",
    "comedores escolares",
    "escolarizacion",
    "curriculo",
    "formacion profesional",
    "educacion infantil",
    "escuela infantil",
    "escuelas infantiles",
    "guarderia",
    "guarderias",
    "bachillerato",
    "selectividad",
    "ebau",
    "lomloe",
    "educacion"
   ],
   "tags_debiles": [
    "becas",
    "aulas",
    "fp",
    "ratio",
    "ratios",
    "colegio",
    "colegios",
    "escuela",
    "escuelas",
    "instituto",
    "institutos",
    "primaria",
    "secundaria",
    "alumnos"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Legislación básica",
     "detalle": "Regula las condiciones de obtención, expedición y homologación de títulos y dicta las normas básicas de desarrollo del derecho a la educación: ordenación general del sistema y enseñanzas mínimas.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.30",
       "bloque": "a149"
      },
      {
       "norma": "Ley Orgánica 2/2006, de Educación (LOE)",
       "id_boe": "BOE-A-2006-7899",
       "articulo": "6 bis",
       "bloque": "a6bis"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Desarrollo legislativo y gestión",
     "detalle": "Desarrolla la normativa y gestiona el sistema educativo en su territorio: centros públicos, contratación y nóminas del profesorado, admisión de alumnos, becas y ayudas propias (comedor, libros) y primer ciclo de infantil.",
     "refs": [
      {
       "norma": "Ley Orgánica 2/2006, de Educación (LOE)",
       "id_boe": "BOE-A-2006-7899",
       "articulo": "6 bis.3",
       "bloque": "a6bis"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Cooperación y mantenimiento",
     "detalle": "Conserva, mantiene y vigila los edificios de los colegios públicos de infantil, primaria y educación especial; coopera en la obtención de solares y vigila el cumplimiento de la escolaridad obligatoria. Muchas escuelas infantiles son de titularidad municipal.",
     "refs": [
      {
       "norma": "Ley 7/1985, Reguladora de las Bases del Régimen Local (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.n",
       "bloque": "a25"
      },
      {
       "norma": "Ley Orgánica 2/2006, de Educación (LOE)",
       "id_boe": "BOE-A-2006-7899",
       "articulo": "disposición adicional 15ª",
       "bloque": "dadecimoquinta"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-CE",
      "ES-ML"
     ],
     "titulo": "Gestión directa del Estado",
     "detalle": "En Ceuta y Melilla la educación no universitaria no está transferida: los centros y el profesorado los gestiona directamente el Ministerio de Educación.",
     "refs": [
      {
       "norma": "Ley Orgánica 2/2006, de Educación (LOE)",
       "id_boe": "BOE-A-2006-7899",
       "articulo": "6 bis",
       "bloque": "a6bis"
      }
     ]
    }
   ]
  },
  {
   "id": "universidades",
   "nombre": "Universidades",
   "descripcion": "Universidades públicas, tasas de matrícula, becas generales y títulos universitarios.",
   "tags": [
    "universidad",
    "universidades",
    "universitario",
    "universitarios",
    "tasas universitarias",
    "matricula universitaria",
    "rector",
    "rectores",
    "grado universitario",
    "doctorado",
    "losu",
    "becas mec"
   ],
   "tags_debiles": [
    "facultad",
    "catedratico",
    "matricula",
    "master",
    "campus"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Legislación básica y becas generales",
     "detalle": "Fija las bases del sistema universitario, las condiciones de los títulos oficiales con validez en toda España y el sistema general de becas y ayudas al estudio.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.30",
       "bloque": "a149"
      },
      {
       "norma": "Ley Orgánica 2/2023, del Sistema Universitario (LOSU)",
       "id_boe": "BOE-A-2023-7500",
       "articulo": "4",
       "bloque": "a4"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Creación, financiación y precios públicos",
     "detalle": "Crea y reconoce universidades en su territorio, financia las universidades públicas y fija los precios públicos de matrícula dentro de los límites generales.",
     "refs": [
      {
       "norma": "Ley Orgánica 2/2023, del Sistema Universitario (LOSU)",
       "id_boe": "BOE-A-2023-7500",
       "articulo": "4",
       "bloque": "a4"
      },
      {
       "norma": "Ley Orgánica 2/2023, del Sistema Universitario (LOSU)",
       "id_boe": "BOE-A-2023-7500",
       "articulo": "57",
       "bloque": "a5-9"
      }
     ]
    }
   ]
  },
  {
   "id": "sanidad",
   "nombre": "Sanidad",
   "descripcion": "Hospitales, centros de salud, urgencias, médicos, farmacia y salud pública.",
   "tags": [
    "hospital",
    "hospitales",
    "centro de salud",
    "centros de salud",
    "medicos",
    "medicas",
    "sanitarios",
    "enfermeria",
    "enfermeras",
    "urgencias",
    "ambulancia",
    "ambulancias",
    "listas de espera",
    "lista de espera",
    "farmacia",
    "farmacias",
    "medicamentos",
    "vacunas",
    "vacunacion",
    "salud publica",
    "atencion primaria",
    "ambulatorio",
    "sanidad",
    "pediatra",
    "pediatras",
    "quirofano",
    "cementerio",
    "cementerios"
   ],
   "tags_debiles": [
    "salud",
    "pacientes",
    "medico",
    "cita"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Bases y coordinación",
     "detalle": "Fija las bases y la coordinación general de la sanidad, la sanidad exterior y la legislación sobre productos farmacéuticos. Define la cartera común de servicios del Sistema Nacional de Salud.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.16",
       "bloque": "a149"
      },
      {
       "norma": "Ley 16/2003, de cohesión y calidad del Sistema Nacional de Salud",
       "id_boe": "BOE-A-2003-10715",
       "articulo": "8",
       "bloque": "a8"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Desarrollo legislativo y gestión",
     "detalle": "Gestiona su servicio de salud: hospitales y centros de salud públicos, contratación del personal sanitario, urgencias y emergencias sanitarias, listas de espera y planificación sanitaria.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.21",
       "bloque": "a148"
      },
      {
       "norma": "Ley 14/1986, General de Sanidad",
       "id_boe": "BOE-A-1986-10499",
       "articulo": "41",
       "bloque": "acuarentayuno"
      },
      {
       "norma": "Ley 14/1986, General de Sanidad",
       "id_boe": "BOE-A-1986-10499",
       "articulo": "50",
       "bloque": "acincuenta"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Salubridad pública",
     "detalle": "Protege la salubridad pública (control sanitario del medio urbano, edificios, industrias y distribución de alimentos) y se ocupa de los cementerios y las actividades funerarias.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.j y 25.2.k",
       "bloque": "a25"
      },
      {
       "norma": "Ley 14/1986, General de Sanidad",
       "id_boe": "BOE-A-1986-10499",
       "articulo": "42",
       "bloque": "acuarentaydos"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-CE",
      "ES-ML"
     ],
     "titulo": "Gestión directa del Estado (INGESA)",
     "detalle": "En Ceuta y Melilla la asistencia sanitaria pública la presta el Estado a través del Instituto Nacional de Gestión Sanitaria (INGESA), no un servicio de salud autonómico.",
     "refs": [
      {
       "norma": "Ley 14/1986, General de Sanidad",
       "id_boe": "BOE-A-1986-10499",
       "articulo": "41",
       "bloque": "acuarentayuno"
      }
     ]
    }
   ]
  },
  {
   "id": "carreteras",
   "nombre": "Carreteras",
   "descripcion": "Autovías, autopistas, carreteras nacionales, autonómicas, provinciales y calles.",
   "tags": [
    "carretera",
    "carreteras",
    "autovia",
    "autovias",
    "autopista",
    "autopistas",
    "peaje",
    "peajes",
    "baches",
    "bache",
    "asfaltado",
    "circunvalacion",
    "socavon",
    "red de carreteras",
    "carretera nacional",
    "carretera comarcal",
    "arreglar la calle"
   ],
   "tags_debiles": [
    "calle",
    "calles",
    "via",
    "vias",
    "radial",
    "rotonda",
    "tramo",
    "asfalto",
    "acera",
    "aceras",
    "pavimento"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Red de Carreteras del Estado",
     "detalle": "Es titular de las carreteras de interés general (autovías A-, autopistas AP- y nacionales N-): las integradas en itinerarios de interés general o que atraviesan más de una comunidad. Las gestiona el Ministerio de Transportes.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.24",
       "bloque": "a149"
      },
      {
       "norma": "Ley 37/2015, de carreteras",
       "id_boe": "BOE-A-2015-10439",
       "articulo": "4",
       "bloque": "a4"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Red autonómica",
     "detalle": "Es titular de las carreteras cuyo itinerario discurre íntegramente por su territorio (por ejemplo M-607, C-32 o A-92). Cada comunidad tiene su propia ley de carreteras.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.5",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "provincial",
     "rol": "Red provincial e insular",
     "detalle": "Las diputaciones, cabildos y consejos insulares prestan los servicios de carácter supramunicipal y cooperan con los municipios pequeños; las leyes de carreteras autonómicas les atribuyen la red provincial o insular que los conecta.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "36",
       "bloque": "a36"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Vías urbanas",
     "detalle": "Se ocupa de la infraestructura viaria urbana: calles, aceras y travesías cedidas, y de la pavimentación de las vías públicas, que es servicio obligatorio en todos los municipios.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.d y 26.1.a",
       "bloque": "a25"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-PV",
      "ES-NC"
     ],
     "titulo": "Régimen foral: no hay red estatal",
     "detalle": "En el País Vasco las carreteras (incluidas las N- y A-) son de las Diputaciones Forales, y en Navarra del Gobierno de Navarra, en virtud de sus derechos históricos.",
     "refs": [
      {
       "norma": "Ley Orgánica 3/1979, Estatuto de Autonomía para el País Vasco",
       "id_boe": "BOE-A-1979-30177",
       "articulo": "10.34",
       "bloque": "a10"
      },
      {
       "norma": "Ley Orgánica 13/1982, de Reintegración y Amejoramiento del Régimen Foral de Navarra",
       "id_boe": "BOE-A-1982-20824",
       "articulo": "49.1.f",
       "bloque": "acuarentaynueve"
      }
     ]
    },
    {
     "ccaa": [
      "ES-CN",
      "ES-IB"
     ],
     "titulo": "Archipiélagos: no hay red estatal",
     "detalle": "Canarias tiene competencia exclusiva sobre toda su red viaria: las carreteras de interés regional son del Gobierno de Canarias y el resto de los Cabildos. En Illes Balears las carreteras son competencia propia de los Consells Insulars.",
     "refs": [
      {
       "norma": "Ley Orgánica 1/2018, de reforma del Estatuto de Autonomía de Canarias",
       "id_boe": "BOE-A-2018-15138",
       "articulo": "162",
       "bloque": "ar-162"
      },
      {
       "norma": "Ley Orgánica 1/2007, de reforma del Estatuto de Autonomía de las Illes Balears",
       "id_boe": "BOE-A-2007-4233",
       "articulo": "70.15",
       "bloque": "a70"
      }
     ]
    }
   ]
  },
  {
   "id": "vivienda",
   "nombre": "Vivienda y urbanismo",
   "descripcion": "Vivienda pública, alquiler, VPO, planes urbanísticos y licencias de obra.",
   "tags": [
    "vivienda",
    "viviendas",
    "alquiler",
    "alquileres",
    "vpo",
    "vivienda protegida",
    "vivienda publica",
    "desahucio",
    "desahucios",
    "urbanismo",
    "licencia de obras",
    "licencia de obra",
    "plan urbanistico",
    "pgou",
    "okupas",
    "okupacion",
    "hipoteca",
    "hipotecas",
    "zona tensionada",
    "zonas tensionadas",
    "pisos turisticos",
    "inquilinos",
    "caseros"
   ],
   "tags_debiles": [
    "suelo",
    "pisos",
    "piso",
    "obras"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Condiciones básicas y legislación civil",
     "detalle": "Regula las condiciones básicas de igualdad en el derecho a la vivienda, la legislación civil (arrendamientos, hipotecas, propiedad) y las bases de la planificación económica.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.1, 149.1.8 y 149.1.13",
       "bloque": "a149"
      },
      {
       "norma": "Ley 12/2023, por el derecho a la vivienda",
       "id_boe": "BOE-A-2023-12203",
       "articulo": "1",
       "bloque": "a1"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Competencia exclusiva",
     "detalle": "Tiene la competencia sobre ordenación del territorio, urbanismo y vivienda: leyes autonómicas de vivienda y suelo, calificación de VPO, planes de vivienda, declaración de zonas tensionadas e inspección.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.3",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Planeamiento y gestión local",
     "detalle": "Aprueba el planeamiento urbanístico (plan general), concede las licencias de obra, ejerce la disciplina urbanística y promueve y gestiona vivienda de protección pública.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.a",
       "bloque": "a25"
      }
     ]
    }
   ]
  },
  {
   "id": "servicios-sociales",
   "nombre": "Servicios sociales y lucha contra la pobreza",
   "descripcion": "Ayudas sociales, ingreso mínimo vital, rentas mínimas, dependencia y protección de menores.",
   "tags": [
    "servicios sociales",
    "pobreza",
    "pobreza infantil",
    "exclusion social",
    "ingreso minimo vital",
    "imv",
    "renta minima",
    "rentas minimas",
    "dependencia",
    "ayuda a domicilio",
    "familias vulnerables",
    "ayudas de emergencia",
    "personas sin hogar",
    "sin techo",
    "discapacidad",
    "residencias de mayores",
    "residencia de mayores",
    "proteccion de menores",
    "menores tutelados",
    "trabajadora social",
    "trabajadores sociales",
    "banco de alimentos"
   ],
   "tags_debiles": [
    "mayores",
    "menores",
    "ayudas",
    "vulnerables",
    "residencias"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Seguridad Social y garantía estatal",
     "detalle": "Legisla y financia la Seguridad Social: gestiona el Ingreso Mínimo Vital a través del INSS y fija el nivel mínimo de protección del sistema de dependencia.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.17",
       "bloque": "a149"
      },
      {
       "norma": "Ley 19/2021, del Ingreso Mínimo Vital",
       "id_boe": "BOE-A-2021-21007",
       "articulo": "25",
       "bloque": "a2-7"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Competencia exclusiva en asistencia social",
     "detalle": "Tiene la competencia de asistencia social: leyes autonómicas de servicios sociales, rentas mínimas autonómicas, protección de menores, residencias y gestión del sistema de dependencia en su territorio.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.20",
       "bloque": "a148"
      },
      {
       "norma": "Ley 39/2006, de Dependencia",
       "id_boe": "BOE-A-2006-21990",
       "articulo": "11",
       "bloque": "a11"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Atención primaria",
     "detalle": "Evalúa e informa de las situaciones de necesidad social y atiende de inmediato a personas en riesgo de exclusión; es servicio obligatorio en municipios de más de 20.000 habitantes. Es la puerta de entrada del ciudadano.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.e y 26.1.c",
       "bloque": "a25"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-PV",
      "ES-NC"
     ],
     "titulo": "Gestión foral del Ingreso Mínimo Vital",
     "detalle": "En el País Vasco y Navarra la gestión del Ingreso Mínimo Vital está asumida por las instituciones forales y autonómicas, no por el INSS.",
     "refs": [
      {
       "norma": "Ley 19/2021, del Ingreso Mínimo Vital",
       "id_boe": "BOE-A-2021-21007",
       "articulo": "disposición adicional 5ª",
       "bloque": "da-5"
      }
     ]
    }
   ]
  },
  {
   "id": "pensiones",
   "nombre": "Pensiones y Seguridad Social",
   "descripcion": "Pensiones de jubilación, viudedad e incapacidad, cotizaciones y bajas.",
   "tags": [
    "pension",
    "pensiones",
    "pensionista",
    "pensionistas",
    "jubilacion",
    "jubilados",
    "seguridad social",
    "cotizacion",
    "cotizaciones",
    "viudedad",
    "incapacidad permanente",
    "incapacidad temporal",
    "baja medica",
    "bajas medicas",
    "inss",
    "pension no contributiva",
    "pensiones no contributivas",
    "autonomos"
   ],
   "tags_debiles": [
    "baja",
    "bajas",
    "cuota"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Competencia exclusiva",
     "detalle": "Legisla y gestiona el régimen económico de la Seguridad Social: cuantía y revalorización de las pensiones, cotizaciones y prestaciones contributivas, a través del INSS y la Tesorería General.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.17",
       "bloque": "a149"
      },
      {
       "norma": "Real Decreto Legislativo 8/2015, Ley General de la Seguridad Social",
       "id_boe": "BOE-A-2015-11724",
       "articulo": "5",
       "bloque": "a5"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Gestión de pensiones no contributivas",
     "detalle": "Gestiona en su territorio las pensiones no contributivas de jubilación e invalidez (las reconoce el órgano autonómico de servicios sociales) y puede añadir ayudas complementarias propias.",
     "refs": [
      {
       "norma": "Real Decreto Legislativo 8/2015, Ley General de la Seguridad Social",
       "id_boe": "BOE-A-2015-11724",
       "articulo": "373",
       "bloque": "a373"
      }
     ]
    }
   ]
  },
  {
   "id": "transporte-publico",
   "nombre": "Transporte público",
   "descripcion": "Metro, autobuses urbanos e interurbanos, Cercanías y trenes.",
   "tags": [
    "cercanias",
    "rodalies",
    "renfe",
    "adif",
    "ferrocarril",
    "ferrocarriles",
    "alta velocidad",
    "autobus",
    "autobuses",
    "autobus urbano",
    "transporte publico",
    "abono transporte",
    "taxi",
    "taxis",
    "vtc",
    "tranvia",
    "linea de metro",
    "metro de madrid",
    "red de metro",
    "estaciones de metro",
    "media distancia",
    "emt"
   ],
   "tags_debiles": [
    "metro",
    "tren",
    "bus",
    "ave",
    "estacion",
    "viajeros",
    "trenes"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Red ferroviaria de interés general",
     "detalle": "Es competente sobre los ferrocarriles que atraviesan más de una comunidad y la Red Ferroviaria de Interés General (alta velocidad, Cercanías y media distancia de Renfe). ADIF y Renfe dependen del Ministerio de Transportes.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.21",
       "bloque": "a149"
      },
      {
       "norma": "Ley 38/2015, del sector ferroviario",
       "id_boe": "BOE-A-2015-10440",
       "articulo": "4",
       "bloque": "a4"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Transporte dentro de su territorio",
     "detalle": "Es competente sobre los ferrocarriles y transportes terrestres que discurren íntegramente por su territorio: redes de metro, ferrocarriles autonómicos, autobuses interurbanos, consorcios de transporte y regulación de taxi y VTC.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.5",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Transporte urbano",
     "detalle": "Presta el transporte colectivo urbano (autobuses urbanos), obligatorio en municipios de más de 50.000 habitantes, y concede las licencias de taxi.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.g y 26.1.d",
       "bloque": "a25"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-CT"
     ],
     "titulo": "Rodalies",
     "detalle": "En Cataluña la Generalitat es titular del servicio de Cercanías y regionales (Rodalies) desde 2010: fija horarios, frecuencias y tarifas. Lo opera Renfe y las vías siguen siendo de ADIF (Estado).",
     "refs": [
      {
       "norma": "Ley Orgánica 6/2006, Estatuto de Autonomía de Cataluña",
       "id_boe": "BOE-A-2006-13087",
       "articulo": "169",
       "bloque": "a169"
      }
     ]
    }
   ]
  },
  {
   "id": "seguridad",
   "nombre": "Seguridad ciudadana y tráfico",
   "descripcion": "Policía Nacional, Guardia Civil, policías autonómicas y locales, multas y tráfico.",
   "tags": [
    "policia nacional",
    "policia local",
    "policia municipal",
    "guardia civil",
    "seguridad ciudadana",
    "delincuencia",
    "criminalidad",
    "multas de trafico",
    "multa de trafico",
    "dgt",
    "zona azul",
    "botellon",
    "mossos",
    "ertzaintza",
    "policia foral",
    "carnet de conducir",
    "itv"
   ],
   "tags_debiles": [
    "policia",
    "policias",
    "trafico",
    "velocidad",
    "aparcamiento",
    "agentes",
    "ruido",
    "multas",
    "radar",
    "radares",
    "robos",
    "comisaria",
    "comisarias"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Competencia exclusiva en seguridad pública",
     "detalle": "Es responsable de la seguridad pública (Policía Nacional y Guardia Civil) y del tráfico y la circulación de vehículos a motor: DGT, permisos de conducir y vigilancia en carretera.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.29 y 149.1.21",
       "bloque": "a149"
      },
      {
       "norma": "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad",
       "id_boe": "BOE-A-1986-6859",
       "articulo": "11",
       "bloque": "aonce"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Policías autonómicas donde existen",
     "detalle": "Las comunidades cuyo Estatuto lo prevé pueden crear policía propia; el resto puede coordinar las policías locales y adscribir unidades de la Policía Nacional.",
     "refs": [
      {
       "norma": "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad",
       "id_boe": "BOE-A-1986-6859",
       "articulo": "37",
       "bloque": "atreintaysiete"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Policía local y tráfico urbano",
     "detalle": "La policía local ordena el tráfico en las vías urbanas (multas de aparcamiento, zona azul), hace cumplir las ordenanzas (ruido, botellón) y colabora en la seguridad ciudadana.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.f y 25.2.g",
       "bloque": "a25"
      },
      {
       "norma": "Ley Orgánica 2/1986, de Fuerzas y Cuerpos de Seguridad",
       "id_boe": "BOE-A-1986-6859",
       "articulo": "53",
       "bloque": "acincuentaytres"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-CT"
     ],
     "titulo": "Mossos d'Esquadra y tráfico propio",
     "detalle": "En Cataluña los Mossos d'Esquadra son la policía ordinaria e integral, y la Generalitat ejerce también la vigilancia del tráfico (Servei Català de Trànsit).",
     "refs": [
      {
       "norma": "Ley Orgánica 6/2006, Estatuto de Autonomía de Cataluña",
       "id_boe": "BOE-A-2006-13087",
       "articulo": "164.1",
       "bloque": "a164"
      }
     ]
    },
    {
     "ccaa": [
      "ES-PV"
     ],
     "titulo": "Ertzaintza",
     "detalle": "En el País Vasco la Ertzaintza es la policía autonómica encargada de la protección de personas y bienes y del orden público; las Fuerzas de Seguridad del Estado conservan los servicios de carácter supracomunitario (fronteras, aduanas, pasaportes).",
     "refs": [
      {
       "norma": "Ley Orgánica 3/1979, Estatuto de Autonomía para el País Vasco",
       "id_boe": "BOE-A-1979-30177",
       "articulo": "17",
       "bloque": "a17"
      }
     ]
    },
    {
     "ccaa": [
      "ES-NC"
     ],
     "titulo": "Policía Foral",
     "detalle": "Navarra cuenta con la Policía Foral, que convive con la Guardia Civil y la Policía Nacional.",
     "refs": [
      {
       "norma": "Ley Orgánica 13/1982, de Reintegración y Amejoramiento del Régimen Foral de Navarra",
       "id_boe": "BOE-A-1982-20824",
       "articulo": "51",
       "bloque": "acincuentayuno"
      }
     ]
    }
   ]
  },
  {
   "id": "proteccion-civil",
   "nombre": "Protección civil, bomberos y emergencias",
   "descripcion": "Bomberos, 112, incendios, inundaciones, planes de emergencia y UME.",
   "tags": [
    "bomberos",
    "bombero",
    "proteccion civil",
    "incendio forestal",
    "incendios forestales",
    "dana",
    "riada",
    "ume",
    "plan de emergencias",
    "alerta roja",
    "es-alert",
    "extincion de incendios"
   ],
   "tags_debiles": [
    "incendio",
    "incendios",
    "emergencia",
    "alerta",
    "temporal",
    "rescate",
    "112",
    "emergencias",
    "inundaciones",
    "inundacion",
    "catastrofe",
    "terremoto",
    "evacuacion"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Emergencias de interés nacional",
     "detalle": "Dirige las emergencias declaradas de interés nacional, coordina el Sistema Nacional de Protección Civil y aporta medios extraordinarios como la Unidad Militar de Emergencias (UME).",
     "refs": [
      {
       "norma": "Ley 17/2015, del Sistema Nacional de Protección Civil",
       "id_boe": "BOE-A-2015-7730",
       "articulo": "28 a 30",
       "bloque": "a28"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Dirección de las emergencias ordinarias",
     "detalle": "Aprueba los planes territoriales de protección civil, gestiona el teléfono 112 y dirige las emergencias en su territorio mientras no se declaren de interés nacional; también la prevención y extinción de incendios forestales.",
     "refs": [
      {
       "norma": "Ley 17/2015, del Sistema Nacional de Protección Civil",
       "id_boe": "BOE-A-2015-7730",
       "articulo": "15.2",
       "bloque": "a15"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Bomberos y protección civil local",
     "detalle": "Es competente en protección civil y prevención y extinción de incendios; el servicio de bomberos es obligatorio en municipios de más de 20.000 habitantes (en los pequeños lo prestan diputaciones o consorcios).",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.f y 26.1.c",
       "bloque": "a25"
      }
     ]
    }
   ]
  },
  {
   "id": "justicia",
   "nombre": "Justicia y prisiones",
   "descripcion": "Juzgados, jueces, fiscales, funcionarios de justicia, registro civil y cárceles.",
   "tags": [
    "juzgado",
    "juzgados",
    "funcionarios de justicia",
    "registro civil",
    "codigo penal",
    "carcel",
    "carceles",
    "prision",
    "prisiones",
    "instituciones penitenciarias",
    "audiencia provincial",
    "atasco judicial",
    "justicia gratuita",
    "abogado de oficio"
   ],
   "tags_debiles": [
    "juicio",
    "juicios",
    "sentencia",
    "presos",
    "magistrado",
    "juez",
    "jueces",
    "tribunal",
    "tribunales",
    "fiscal",
    "fiscales",
    "fiscalia",
    "justicia",
    "letrados"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Competencia exclusiva",
     "detalle": "La Administración de Justicia es competencia exclusiva del Estado, igual que la legislación penal, procesal y penitenciaria. Jueces y fiscales pertenecen a cuerpos nacionales y su gobierno corresponde al Consejo General del Poder Judicial.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.5 y 149.1.6",
       "bloque": "a149"
      },
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "122",
       "bloque": "a122"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Medios materiales y personales",
     "detalle": "Las comunidades con la competencia transferida ponen los medios al servicio de los juzgados: edificios, informática, funcionarios de justicia y justicia gratuita. Donde no está transferida lo hace el Ministerio de Justicia.",
     "refs": [
      {
       "norma": "Ley Orgánica 6/1985, del Poder Judicial",
       "id_boe": "BOE-A-1985-12666",
       "articulo": "37",
       "bloque": "atreintaysiete"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-CM",
      "ES-CL",
      "ES-EX",
      "ES-MC",
      "ES-IB",
      "ES-CE",
      "ES-ML"
     ],
     "titulo": "Territorio Ministerio",
     "detalle": "En esta comunidad los medios de la Administración de Justicia no están transferidos: edificios, funcionarios e informática judicial dependen directamente del Ministerio de Justicia.",
     "refs": [
      {
       "norma": "Ley Orgánica 6/1985, del Poder Judicial",
       "id_boe": "BOE-A-1985-12666",
       "articulo": "37",
       "bloque": "atreintaysiete"
      }
     ]
    },
    {
     "ccaa": [
      "ES-CT",
      "ES-PV"
     ],
     "titulo": "Gestión de las prisiones",
     "detalle": "Cataluña y el País Vasco gestionan sus propias cárceles (ejecución de la legislación penitenciaria del Estado). En el resto de España las gestiona Instituciones Penitenciarias, del Ministerio del Interior.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.6",
       "bloque": "a149"
      }
     ]
    }
   ]
  },
  {
   "id": "fiscalidad",
   "nombre": "Impuestos y financiación",
   "descripcion": "IRPF, IVA, sociedades, sucesiones, patrimonio, IBI y tasas municipales.",
   "tags": [
    "impuesto",
    "impuestos",
    "irpf",
    "iva",
    "impuesto de sociedades",
    "impuesto de patrimonio",
    "transmisiones patrimoniales",
    "ibi",
    "plusvalia municipal",
    "impuesto de circulacion",
    "tasas municipales",
    "tasa turistica",
    "agencia tributaria",
    "declaracion de la renta",
    "financiacion autonomica",
    "presupuestos generales",
    "concierto economico",
    "cupo vasco",
    "rebaja fiscal",
    "subida de impuestos",
    "bajada de impuestos",
    "tributos",
    "igic"
   ],
   "tags_debiles": [
    "renta",
    "fiscal",
    "tasas",
    "tasa",
    "recaudacion",
    "contribucion",
    "hacienda",
    "sucesiones",
    "donaciones"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Hacienda general",
     "detalle": "Tiene la potestad originaria para establecer tributos y la competencia sobre la Hacienda general: regula IRPF, IVA, Sociedades e impuestos especiales y los recauda a través de la Agencia Tributaria.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "133",
       "bloque": "a133"
      },
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.14",
       "bloque": "a149"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Tributos cedidos y propios",
     "detalle": "Gestiona y puede modificar los tributos cedidos (Sucesiones y Donaciones, Patrimonio, Transmisiones Patrimoniales) y el tramo autonómico del IRPF, y puede crear impuestos propios.",
     "refs": [
      {
       "norma": "Ley Orgánica 8/1980, de Financiación de las Comunidades Autónomas (LOFCA)",
       "id_boe": "BOE-A-1980-21166",
       "articulo": "10",
       "bloque": "adecimo"
      },
      {
       "norma": "Ley Orgánica 8/1980, de Financiación de las Comunidades Autónomas (LOFCA)",
       "id_boe": "BOE-A-1980-21166",
       "articulo": "19",
       "bloque": "adecimonoveno"
      },
      {
       "norma": "Ley 22/2009, del sistema de financiación autonómica",
       "id_boe": "BOE-A-2009-20375",
       "articulo": "25",
       "bloque": "a25"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Impuestos y tasas locales",
     "detalle": "Exige el IBI, el impuesto de circulación y el de actividades económicas, y puede establecer el de construcciones y la plusvalía municipal, además de tasas como la de basuras.",
     "refs": [
      {
       "norma": "Real Decreto Legislativo 2/2004, Ley Reguladora de las Haciendas Locales",
       "id_boe": "BOE-A-2004-4214",
       "articulo": "59",
       "bloque": "a59"
      }
     ]
    }
   ],
   "excepciones": [
    {
     "ccaa": [
      "ES-PV"
     ],
     "titulo": "Concierto Económico",
     "detalle": "En el País Vasco las Haciendas Forales de Álava, Bizkaia y Gipuzkoa regulan y recaudan casi todos los impuestos (IRPF, Sociedades, IVA) y pagan al Estado un cupo por las competencias no asumidas.",
     "refs": [
      {
       "norma": "Ley 12/2002, Concierto Económico con la Comunidad Autónoma del País Vasco",
       "id_boe": "BOE-A-2002-9969",
       "articulo": "1",
       "bloque": "a1"
      }
     ]
    },
    {
     "ccaa": [
      "ES-NC"
     ],
     "titulo": "Convenio Económico",
     "detalle": "Navarra regula y recauda sus propios tributos a través de la Hacienda Foral y abona al Estado una aportación por las cargas generales.",
     "refs": [
      {
       "norma": "Ley 28/1990, Convenio Económico entre el Estado y la Comunidad Foral de Navarra",
       "id_boe": "BOE-A-1990-31117",
       "articulo": "1",
       "bloque": "a1"
      }
     ]
    },
    {
     "ccaa": [
      "ES-CN"
     ],
     "titulo": "Régimen Económico y Fiscal de Canarias",
     "detalle": "En Canarias no se aplica el IVA: en su lugar existe el Impuesto General Indirecto Canario (IGIC), con tipos más bajos, dentro de su régimen económico y fiscal propio.",
     "refs": [
      {
       "norma": "Ley 20/1991, de modificación de los aspectos fiscales del Régimen Económico Fiscal de Canarias",
       "id_boe": "BOE-A-1991-14463",
       "articulo": "2",
       "bloque": "a2"
      }
     ]
    }
   ]
  },
  {
   "id": "empleo",
   "nombre": "Empleo y relaciones laborales",
   "descripcion": "Paro, SEPE, contratos, salario mínimo, formación y políticas de empleo.",
   "tags": [
    "empleo",
    "desempleo",
    "sepe",
    "prestacion por desempleo",
    "subsidio de desempleo",
    "salario minimo",
    "smi",
    "erte",
    "ertes",
    "reforma laboral",
    "formacion para el empleo",
    "inspeccion de trabajo",
    "convenio colectivo",
    "convenios colectivos",
    "jornada laboral",
    "despido",
    "despidos",
    "oficina de empleo",
    "parados",
    "estatuto de los trabajadores",
    "cobrar el paro",
    "contrato de trabajo",
    "contratos temporales"
   ],
   "tags_debiles": [
    "paro",
    "contrato",
    "contratos",
    "huelga",
    "ere",
    "trabajadores",
    "sindicatos"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Legislación laboral y prestaciones",
     "detalle": "Aprueba toda la legislación laboral (Estatuto de los Trabajadores, salario mínimo, ERTE) y paga las prestaciones por desempleo a través del SEPE.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.7 y 149.1.17",
       "bloque": "a149"
      },
      {
       "norma": "Real Decreto Legislativo 2/2015, Estatuto de los Trabajadores",
       "id_boe": "BOE-A-2015-11430",
       "articulo": "27",
       "bloque": "a27"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Ejecución y políticas activas",
     "detalle": "Ejecuta la legislación laboral y gestiona las políticas activas de empleo con su servicio público de empleo: orientación, formación e intermediación.",
     "refs": [
      {
       "norma": "Ley 3/2023, de Empleo",
       "id_boe": "BOE-A-2023-5365",
       "articulo": "23",
       "bloque": "a2-5"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Programas locales por delegación",
     "detalle": "El empleo no es competencia propia municipal: los ayuntamientos desarrollan programas de empleo y agencias de desarrollo local por delegación o convenio con la comunidad autónoma.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "7.4 y 27",
       "bloque": "a7"
      }
     ]
    }
   ]
  },
  {
   "id": "extranjeria",
   "nombre": "Inmigración y extranjería",
   "descripcion": "Permisos de residencia, asilo, fronteras, nacionalidad, acogida e integración.",
   "tags": [
    "inmigracion",
    "inmigrantes",
    "migrantes",
    "extranjeria",
    "permiso de residencia",
    "permisos de residencia",
    "pateras",
    "cayucos",
    "menores no acompañados",
    "menas",
    "arraigo",
    "padron",
    "empadronamiento"
   ],
   "tags_debiles": [
    "extranjeros",
    "visado",
    "visados",
    "acogida",
    "asilo",
    "refugiados",
    "nacionalidad",
    "fronteras",
    "frontera",
    "regularizacion",
    "deportacion",
    "expulsiones",
    "cie",
    "nie"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Competencia exclusiva",
     "detalle": "Tiene la competencia exclusiva sobre nacionalidad, inmigración, emigración, extranjería y derecho de asilo: permisos de residencia y trabajo, control de fronteras, expulsiones y protección internacional.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.2",
       "bloque": "a149"
      },
      {
       "norma": "Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros",
       "id_boe": "BOE-A-2000-544",
       "articulo": "2 bis",
       "bloque": "a2.bis"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Integración y tutela de menores",
     "detalle": "Se encarga de la integración social (acogida, sanidad, educación, servicios sociales) y, como entidad de protección de menores, de la tutela de los menores extranjeros no acompañados.",
     "refs": [
      {
       "norma": "Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros",
       "id_boe": "BOE-A-2000-544",
       "articulo": "2 ter",
       "bloque": "a2.ter"
      },
      {
       "norma": "Ley Orgánica 4/2000, sobre derechos y libertades de los extranjeros",
       "id_boe": "BOE-A-2000-544",
       "articulo": "35",
       "bloque": "a35"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Padrón e informes",
     "detalle": "Inscribe en el padrón municipal a quienes residen en el municipio, con independencia de su situación administrativa, y emite informes para los trámites de extranjería (vivienda, arraigo) según la normativa autonómica.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "15 a 17",
       "bloque": "a15"
      }
     ]
    }
   ]
  },
  {
   "id": "energia",
   "nombre": "Energía",
   "descripcion": "Factura de la luz, red eléctrica, renovables, gas y alumbrado público.",
   "tags": [
    "factura de la luz",
    "precio de la luz",
    "electricidad",
    "red electrica",
    "apagon",
    "apagones",
    "renovables",
    "parque eolico",
    "parques eolicos",
    "placas solares",
    "planta fotovoltaica",
    "fotovoltaica",
    "central nuclear",
    "gas natural",
    "tarifa regulada",
    "pvpc",
    "bono social",
    "alumbrado publico",
    "farolas",
    "autoconsumo",
    "electricas"
   ],
   "tags_debiles": [
    "luz",
    "gas",
    "eolica",
    "solar",
    "tarifa",
    "energia",
    "nuclear",
    "nucleares",
    "gasolina",
    "gasolineras"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Bases del régimen energético",
     "detalle": "Fija las bases del régimen energético: regula el mercado y la tarifa eléctrica, el bono social y la red de transporte, y autoriza las instalaciones que superan una comunidad o los 50 MW de potencia.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.22 y 149.1.25",
       "bloque": "a149"
      },
      {
       "norma": "Ley 24/2013, del Sector Eléctrico",
       "id_boe": "BOE-A-2013-13645",
       "articulo": "3",
       "bloque": "a3"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Desarrollo y autorizaciones en su territorio",
     "detalle": "Desarrolla la normativa básica y autoriza las instalaciones que la ley no reserva al Estado: las de hasta 50 MW que no salen de su territorio, es decir, la mayoría de parques eólicos y plantas solares.",
     "refs": [
      {
       "norma": "Ley 24/2013, del Sector Eléctrico",
       "id_boe": "BOE-A-2013-13645",
       "articulo": "3.13",
       "bloque": "a3"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Alumbrado público y licencias",
     "detalle": "Presta el alumbrado público, servicio obligatorio en todos los municipios, y concede las licencias urbanísticas de las instalaciones.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "26.1.a",
       "bloque": "a26"
      }
     ]
    }
   ]
  },
  {
   "id": "medio-ambiente",
   "nombre": "Medio ambiente",
   "descripcion": "Contaminación, espacios protegidos, ruido y zonas de bajas emisiones.",
   "tags": [
    "medio ambiente",
    "contaminacion",
    "zona de bajas emisiones",
    "zonas de bajas emisiones",
    "zbe",
    "espacios naturales",
    "parque natural",
    "parques naturales",
    "parque nacional",
    "parques nacionales",
    "calidad del aire",
    "cambio climatico",
    "vertidos",
    "vertido",
    "contaminacion acustica",
    "biodiversidad",
    "especies protegidas",
    "parques y jardines",
    "arbolado"
   ],
   "tags_debiles": [
    "ruido",
    "humo",
    "parque",
    "parques",
    "arboles",
    "caza",
    "lobo",
    "emisiones"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Legislación básica",
     "detalle": "Dicta la legislación básica de protección del medio ambiente, que fija un mínimo común que las comunidades pueden elevar.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.23",
       "bloque": "a149"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Normas adicionales y gestión",
     "detalle": "Gestiona la protección del medio ambiente y puede aprobar normas adicionales de protección: espacios naturales protegidos, autorizaciones ambientales, caza y pesca fluvial.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.9 y 148.1.11",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Medio ambiente urbano",
     "detalle": "Se ocupa del medio ambiente urbano: parques y jardines públicos y protección contra la contaminación acústica, lumínica y atmosférica. Los municipios de más de 50.000 habitantes deben tener zona de bajas emisiones.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.b",
       "bloque": "a25"
      },
      {
       "norma": "Ley 7/2021, de cambio climático y transición energética",
       "id_boe": "BOE-A-2021-8447",
       "articulo": "14.3",
       "bloque": "a1-6"
      }
     ]
    }
   ]
  },
  {
   "id": "residuos-limpieza",
   "nombre": "Residuos y limpieza viaria",
   "descripcion": "Recogida de basuras, reciclaje, limpieza de calles y puntos limpios.",
   "tags": [
    "basura",
    "basuras",
    "residuos",
    "reciclaje",
    "limpieza viaria",
    "limpieza de calles",
    "limpieza de las calles",
    "punto limpio",
    "puntos limpios",
    "vertedero",
    "vertederos",
    "tasa de basuras",
    "recogida de basura",
    "recogida de basuras",
    "recogida de residuos",
    "barrenderos",
    "incineradora"
   ],
   "tags_debiles": [
    "limpieza",
    "recogida",
    "suciedad",
    "contenedores",
    "contenedor"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Legislación básica",
     "detalle": "Dicta la legislación básica de residuos: obligaciones de recogida separada, responsabilidad del productor e impuesto sobre el depósito en vertedero y la incineración.",
     "refs": [
      {
       "norma": "Ley 7/2022, de residuos y suelos contaminados",
       "id_boe": "BOE-A-2022-5809",
       "articulo": "12.1 a 12.3",
       "bloque": "a1-4"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Planificación y autorización",
     "detalle": "Aprueba los programas autonómicos de prevención y los planes de gestión de residuos, autoriza las instalaciones de tratamiento y ejerce la inspección y sanción.",
     "refs": [
      {
       "norma": "Ley 7/2022, de residuos y suelos contaminados",
       "id_boe": "BOE-A-2022-5809",
       "articulo": "12.4",
       "bloque": "a1-4"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Servicio obligatorio",
     "detalle": "Recoge los residuos y limpia las calles, servicios obligatorios en todos los municipios (el tratamiento lo es a partir de 5.000 habitantes), y cobra la tasa de basuras.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "26.1.a y 26.1.b",
       "bloque": "a26"
      },
      {
       "norma": "Ley 7/2022, de residuos y suelos contaminados",
       "id_boe": "BOE-A-2022-5809",
       "articulo": "12.5",
       "bloque": "a1-4"
      }
     ]
    }
   ]
  },
  {
   "id": "aguas",
   "nombre": "Aguas",
   "descripcion": "Ríos, embalses, confederaciones hidrográficas, agua del grifo y alcantarillado.",
   "tags": [
    "embalse",
    "embalses",
    "pantano",
    "pantanos",
    "sequia",
    "confederacion hidrografica",
    "confederaciones hidrograficas",
    "trasvase",
    "trasvases",
    "agua potable",
    "agua del grifo",
    "alcantarillado",
    "depuradora",
    "depuradoras",
    "abastecimiento de agua",
    "regadio",
    "regadios",
    "desaladora",
    "desaladoras",
    "cauce",
    "cauces",
    "recibo del agua",
    "restricciones de agua",
    "cortes de agua",
    "acuifero",
    "acuiferos",
    "aguas residuales"
   ],
   "tags_debiles": [
    "agua",
    "aguas",
    "rio",
    "rios",
    "canal",
    "presa",
    "riego"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Cuencas que atraviesan varias comunidades",
     "detalle": "Legisla, ordena y concede los recursos hidráulicos cuando las aguas discurren por más de una comunidad (Tajo, Ebro, Duero, Guadalquivir…): las Confederaciones Hidrográficas dependen del Ministerio para la Transición Ecológica.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.22",
       "bloque": "a149"
      },
      {
       "norma": "Real Decreto Legislativo 1/2001, texto refundido de la Ley de Aguas",
       "id_boe": "BOE-A-2001-14276",
       "articulo": "17",
       "bloque": "a17"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Cuencas internas",
     "detalle": "Gestiona las cuencas que discurren íntegramente por su territorio (cuencas internas de Cataluña, Galicia-Costa, cuencas mediterráneas andaluzas…) y los aprovechamientos hidráulicos de interés autonómico.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.10",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Abastecimiento y saneamiento",
     "detalle": "Lleva el agua potable a los domicilios y evacúa y trata las aguas residuales (alcantarillado): son servicios obligatorios en todos los municipios.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.c y 26.1.a",
       "bloque": "a25"
      }
     ]
    }
   ]
  },
  {
   "id": "cultura-deporte",
   "nombre": "Cultura y deporte",
   "descripcion": "Museos, bibliotecas, patrimonio, instalaciones deportivas y fiestas.",
   "tags": [
    "museo",
    "museos",
    "biblioteca",
    "bibliotecas",
    "patrimonio historico",
    "patrimonio cultural",
    "monumento",
    "monumentos",
    "polideportivo",
    "polideportivos",
    "instalaciones deportivas",
    "piscina municipal",
    "fiestas patronales",
    "fiestas populares",
    "bien de interes cultural",
    "yacimiento",
    "archivo historico",
    "lengua cooficial",
    "bono cultural"
   ],
   "tags_debiles": [
    "cultura",
    "deporte",
    "fiestas",
    "teatro",
    "festival",
    "festivales",
    "patrimonio",
    "archivos"
   ],
   "niveles": [
    {
     "administracion": "estado",
     "rol": "Museos estatales y defensa del patrimonio",
     "detalle": "Considera el servicio de la cultura un deber esencial: gestiona los museos, bibliotecas y archivos de titularidad estatal (Prado, Biblioteca Nacional) y defiende el patrimonio contra la exportación y la expoliación.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "149.1.28 y 149.2",
       "bloque": "a149"
      }
     ]
    },
    {
     "administracion": "ccaa",
     "rol": "Competencia exclusiva",
     "detalle": "Es competente sobre museos, bibliotecas y conservatorios de interés autonómico, patrimonio monumental, fomento de la cultura y de la lengua propia y promoción del deporte.",
     "refs": [
      {
       "norma": "Constitución Española",
       "id_boe": "BOE-A-1978-31229",
       "articulo": "148.1.15 a 148.1.19",
       "bloque": "a148"
      }
     ]
    },
    {
     "administracion": "municipal",
     "rol": "Equipamientos de proximidad",
     "detalle": "Promueve la cultura y el deporte y gestiona sus equipamientos e instalaciones. La biblioteca pública es obligatoria en municipios de más de 5.000 habitantes y las instalaciones deportivas a partir de 20.000.",
     "refs": [
      {
       "norma": "Ley 7/1985 (LBRL)",
       "id_boe": "BOE-A-1985-5392",
       "articulo": "25.2.l, 25.2.m y 26.1",
       "bloque": "a25"
      }
     ]
    }
   ]
  }
 ]
};
