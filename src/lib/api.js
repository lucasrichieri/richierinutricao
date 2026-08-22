// API de Integração com o Banco de Dados Neon (Richieri Nutrição)

const STORAGE_KEYS = {
  PACIENTES: 'richieri_pacientes',
  CONSULTAS: 'richieri_consultas',
  PLANOS: 'richieri_planos',
  PERFIL: 'richieri_perfil',
};

// Helper de LocalStorage para resiliência e cache
function getLocalData(key, fallback = []) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch (e) {
    return fallback;
  }
}

function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Erro ao salvar no cache local:', e);
  }
}

/**
 * Inicializa as tabelas no Neon caso ainda não tenham sido criadas
 */
export async function initDatabaseSchema(sql) {
  if (!sql) return;

  try {
    // Tabela nutricionistas
    await sql`
      CREATE TABLE IF NOT EXISTS nutricionistas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nome TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        crn TEXT,
        telefone TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela pacientes
    await sql`
      CREATE TABLE IF NOT EXISTS pacientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nutricionista_id UUID,
        nome TEXT NOT NULL,
        data_nascimento DATE,
        sexo TEXT,
        whatsapp TEXT,
        email TEXT,
        peso_inicial NUMERIC,
        altura NUMERIC,
        objetivos TEXT[],
        objetivo_texto TEXT,
        nivel_atividade TEXT,
        patologias TEXT[],
        restricoes_alimentares TEXT[],
        alergias TEXT[],
        medicamentos TEXT,
        suplementos TEXT,
        refeicoes_por_dia INTEGER,
        horario_acorda TEXT,
        horario_dorme TEXT,
        litros_agua NUMERIC,
        atividade_fisica BOOLEAN DEFAULT FALSE,
        atividade_fisica_descricao TEXT,
        observacoes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela consultas
    await sql`
      CREATE TABLE IF NOT EXISTS consultas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID,
        data_consulta DATE NOT NULL,
        peso NUMERIC,
        cintura NUMERIC,
        quadril NUMERIC,
        percentual_gordura NUMERIC,
        observacoes TEXT,
        proximo_retorno DATE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Tabela planos_alimentares
    await sql`
      CREATE TABLE IF NOT EXISTS planos_alimentares (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        paciente_id UUID,
        titulo TEXT,
        conteudo JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    console.log('Schema Neon verificado com sucesso.');
  } catch (err) {
    console.warn('Aviso ao inicializar schema Neon:', err.message);
  }
}

/* ==========================================================================
   NUTRICIONISTAS & PERFIL
   ========================================================================== */

export async function getPerfilNutricionista(sql, user) {
  if (!user) return null;
  const local = getLocalData(STORAGE_KEYS.PERFIL, null);

  if (!sql) {
    return local || {
      nome: user.name || 'Nutricionista',
      email: user.email,
      crn: 'CRN-3 12345/P',
      telefone: '(11) 99999-8888',
      especialidade: 'Nutrição Clínica & Esportiva',
    };
  }

  try {
    const rows = await sql`
      SELECT * FROM nutricionistas WHERE email = ${user.email} LIMIT 1
    `;
    if (rows && rows.length > 0) {
      const perfil = rows[0];
      setLocalData(STORAGE_KEYS.PERFIL, perfil);
      return perfil;
    } else {
      // Cria registro se não existir
      const inserted = await sql`
        INSERT INTO nutricionistas (nome, email, crn, telefone)
        VALUES (${user.name || 'Nutricionista'}, ${user.email}, 'CRN-3 12345/P', '(11) 99999-8888')
        RETURNING *
      `;
      if (inserted && inserted.length > 0) {
        setLocalData(STORAGE_KEYS.PERFIL, inserted[0]);
        return inserted[0];
      }
    }
  } catch (err) {
    console.warn('Falha ao buscar perfil no Neon, usando cache:', err.message);
  }

  return local || {
    nome: user.name || 'Nutricionista',
    email: user.email,
    crn: 'CRN-3 12345/P',
    telefone: '(11) 99999-8888',
    especialidade: 'Nutrição Clínica & Esportiva',
  };
}

export async function updatePerfilNutricionista(sql, user, data) {
  const updated = { ...data, email: user.email };
  setLocalData(STORAGE_KEYS.PERFIL, updated);

  if (sql && user?.email) {
    try {
      await sql`
        UPDATE nutricionistas
        SET nome = ${data.nome}, crn = ${data.crn}, telefone = ${data.telefone}
        WHERE email = ${user.email}
      `;
    } catch (err) {
      console.warn('Erro ao atualizar perfil no Neon:', err.message);
    }
  }
  return updated;
}

/* ==========================================================================
   PACIENTES
   ========================================================================== */

export async function getPacientes(sql, nutricionistaId = null) {
  const local = getLocalData(STORAGE_KEYS.PACIENTES, []);
  if (!sql) {
    return nutricionistaId ? local.filter(p => !p.nutricionista_id || p.nutricionista_id === nutricionistaId) : local;
  }

  try {
    let rows;
    if (nutricionistaId) {
      rows = await sql`
        SELECT * FROM pacientes 
        WHERE nutricionista_id = ${nutricionistaId} OR nutricionista_id IS NULL 
        ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT * FROM pacientes ORDER BY created_at DESC
      `;
    }
    if (rows) {
      setLocalData(STORAGE_KEYS.PACIENTES, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar pacientes do Neon, usando cache:', err.message);
  }
  return local;
}

export async function createPaciente(sql, pacienteData, nutricionistaId = null) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `pac_${Date.now()}`;
  const now = new Date().toISOString();

  const newPatient = {
    id,
    nutricionista_id: nutricionistaId,
    ...pacienteData,
    created_at: now,
  };

  // Salva no cache local
  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  const updated = [newPatient, ...current];
  setLocalData(STORAGE_KEYS.PACIENTES, updated);

  if (sql) {
    try {
      const inserted = await sql`
        INSERT INTO pacientes (
          nutricionista_id, nome, data_nascimento, sexo, whatsapp, email,
          peso_inicial, altura, objetivos, objetivo_texto,
          nivel_atividade, patologias, restricoes_alimentares, alergias,
          medicamentos, suplementos, refeicoes_por_dia, horario_acorda,
          horario_dorme, litros_agua, atividade_fisica, atividade_fisica_descricao, observacoes
        ) VALUES (
          ${nutricionistaId || null}, ${pacienteData.nome}, ${pacienteData.data_nascimento || null}, ${pacienteData.sexo || null},
          ${pacienteData.whatsapp || null}, ${pacienteData.email || null}, ${pacienteData.peso_inicial || null},
          ${pacienteData.altura || null}, ${pacienteData.objetivos || []}, ${pacienteData.objetivo_texto || null},
          ${pacienteData.nivel_atividade || null}, ${pacienteData.patologias || []}, ${pacienteData.restricoes_alimentares || []},
          ${pacienteData.alergias || []}, ${pacienteData.medicamentos || null}, ${pacienteData.suplementos || null},
          ${pacienteData.refeicoes_por_dia || null}, ${pacienteData.horario_acorda || null}, ${pacienteData.horario_dorme || null},
          ${pacienteData.litros_agua || null}, ${Boolean(pacienteData.atividade_fisica)}, ${pacienteData.atividade_fisica_descricao || null},
          ${pacienteData.observacoes || null}
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        // Atualiza o ID retornado do banco
        const finalPatient = inserted[0];
        const syncList = updated.map(p => (p.id === id ? finalPatient : p));
        setLocalData(STORAGE_KEYS.PACIENTES, syncList);
        return finalPatient;
      }
    } catch (err) {
      console.warn('Erro ao inserir paciente no Neon, mantido localmente:', err.message);
    }
  }

  return newPatient;
}

export async function updatePaciente(sql, pacienteId, pacienteData) {
  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  const updated = current.map(p => (p.id === pacienteId ? { ...p, ...pacienteData } : p));
  setLocalData(STORAGE_KEYS.PACIENTES, updated);

  if (sql) {
    try {
      await sql`
        UPDATE pacientes SET
          nome = ${pacienteData.nome},
          data_nascimento = ${pacienteData.data_nascimento || null},
          sexo = ${pacienteData.sexo || null},
          whatsapp = ${pacienteData.whatsapp || null},
          email = ${pacienteData.email || null},
          peso_inicial = ${pacienteData.peso_inicial || null},
          altura = ${pacienteData.altura || null},
          objetivos = ${pacienteData.objetivos || []},
          objetivo_texto = ${pacienteData.objetivo_texto || null},
          nivel_atividade = ${pacienteData.nivel_atividade || null},
          patologias = ${pacienteData.patologias || []},
          restricoes_alimentares = ${pacienteData.restricoes_alimentares || []},
          alergias = ${pacienteData.alergias || []},
          medicamentos = ${pacienteData.medicamentos || null},
          suplementos = ${pacienteData.suplementos || null},
          refeicoes_por_dia = ${pacienteData.refeicoes_por_dia || null},
          horario_acorda = ${pacienteData.horario_acorda || null},
          horario_dorme = ${pacienteData.horario_dorme || null},
          litros_agua = ${pacienteData.litros_agua || null},
          atividade_fisica = ${Boolean(pacienteData.atividade_fisica)},
          atividade_fisica_descricao = ${pacienteData.atividade_fisica_descricao || null},
          observacoes = ${pacienteData.observacoes || null}
        WHERE id = ${pacienteId}
      `;
    } catch (err) {
      console.warn('Erro ao atualizar paciente no Neon:', err.message);
    }
  }
  return { id: pacienteId, ...pacienteData };
}

export async function deletePaciente(sql, pacienteId) {
  const current = getLocalData(STORAGE_KEYS.PACIENTES, []);
  setLocalData(STORAGE_KEYS.PACIENTES, current.filter(p => p.id !== pacienteId));

  // Remove também consultas e planos desse paciente
  const consultas = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  setLocalData(STORAGE_KEYS.CONSULTAS, consultas.filter(c => c.paciente_id !== pacienteId));

  const planos = getLocalData(STORAGE_KEYS.PLANOS, []);
  setLocalData(STORAGE_KEYS.PLANOS, planos.filter(p => p.paciente_id !== pacienteId));

  if (sql) {
    try {
      await sql`DELETE FROM planos_alimentares WHERE paciente_id = ${pacienteId}`;
      await sql`DELETE FROM consultas WHERE paciente_id = ${pacienteId}`;
      await sql`DELETE FROM pacientes WHERE id = ${pacienteId}`;
    } catch (err) {
      console.warn('Erro ao deletar paciente no Neon:', err.message);
    }
  }
  return true;
}

/* ==========================================================================
   CONSULTAS
   ========================================================================== */

export async function getConsultas(sql, pacienteId = null) {
  const local = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  if (!sql) {
    return pacienteId ? local.filter(c => c.paciente_id === pacienteId) : local;
  }

  try {
    let rows;
    if (pacienteId) {
      rows = await sql`
        SELECT * FROM consultas WHERE paciente_id = ${pacienteId} ORDER BY data_consulta DESC
      `;
    } else {
      rows = await sql`
        SELECT c.*, p.nome as paciente_nome 
        FROM consultas c 
        LEFT JOIN pacientes p ON c.paciente_id = p.id 
        ORDER BY c.data_consulta DESC
      `;
    }
    if (rows) {
      if (!pacienteId) setLocalData(STORAGE_KEYS.CONSULTAS, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar consultas do Neon, usando cache:', err.message);
  }

  return pacienteId ? local.filter(c => c.paciente_id === pacienteId) : local;
}

export async function createConsulta(sql, consultaData) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `cons_${Date.now()}`;
  const now = new Date().toISOString();

  const newConsulta = {
    id,
    ...consultaData,
    created_at: now,
  };

  const current = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  const updated = [newConsulta, ...current];
  setLocalData(STORAGE_KEYS.CONSULTAS, updated);

  if (sql) {
    try {
      const inserted = await sql`
        INSERT INTO consultas (
          paciente_id, data_consulta, peso, cintura, quadril,
          percentual_gordura, observacoes, proximo_retorno
        ) VALUES (
          ${consultaData.paciente_id}, ${consultaData.data_consulta}, ${consultaData.peso || null},
          ${consultaData.cintura || null}, ${consultaData.quadril || null}, ${consultaData.percentual_gordura || null},
          ${consultaData.observacoes || null}, ${consultaData.proximo_retorno || null}
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        const finalConsulta = inserted[0];
        const syncList = updated.map(c => (c.id === id ? finalConsulta : c));
        setLocalData(STORAGE_KEYS.CONSULTAS, syncList);
        return finalConsulta;
      }
    } catch (err) {
      console.warn('Erro ao inserir consulta no Neon, mantido localmente:', err.message);
    }
  }

  return newConsulta;
}

export async function deleteConsulta(sql, consultaId) {
  const current = getLocalData(STORAGE_KEYS.CONSULTAS, []);
  setLocalData(STORAGE_KEYS.CONSULTAS, current.filter(c => c.id !== consultaId));

  if (sql) {
    try {
      await sql`DELETE FROM consultas WHERE id = ${consultaId}`;
    } catch (err) {
      console.warn('Erro ao excluir consulta no Neon:', err.message);
    }
  }
  return true;
}

/* ==========================================================================
   PLANOS ALIMENTARES
   ========================================================================== */

export async function getPlanosAlimentares(sql, pacienteId = null) {
  const local = getLocalData(STORAGE_KEYS.PLANOS, []);
  if (!sql) {
    return pacienteId ? local.filter(p => p.paciente_id === pacienteId) : local;
  }

  try {
    let rows;
    if (pacienteId) {
      rows = await sql`
        SELECT * FROM planos_alimentares WHERE paciente_id = ${pacienteId} ORDER BY created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT pl.*, p.nome as paciente_nome 
        FROM planos_alimentares pl 
        LEFT JOIN pacientes p ON pl.paciente_id = p.id 
        ORDER BY pl.created_at DESC
      `;
    }
    if (rows) {
      if (!pacienteId) setLocalData(STORAGE_KEYS.PLANOS, rows);
      return rows;
    }
  } catch (err) {
    console.warn('Falha ao buscar planos alimentares do Neon, usando cache:', err.message);
  }

  return pacienteId ? local.filter(p => p.paciente_id === pacienteId) : local;
}

export async function createPlanoAlimentar(sql, planoData) {
  const id = crypto.randomUUID ? crypto.randomUUID() : `pln_${Date.now()}`;
  const now = new Date().toISOString();

  const newPlano = {
    id,
    ...planoData,
    created_at: now,
  };

  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  const updated = [newPlano, ...current];
  setLocalData(STORAGE_KEYS.PLANOS, updated);

  if (sql) {
    try {
      const conteudoJson = typeof planoData.conteudo === 'string' ? planoData.conteudo : JSON.stringify(planoData.conteudo);
      const inserted = await sql`
        INSERT INTO planos_alimentares (
          paciente_id, titulo, conteudo
        ) VALUES (
          ${planoData.paciente_id}, ${planoData.titulo || 'Plano Alimentar'}, ${conteudoJson}::jsonb
        ) RETURNING *
      `;
      if (inserted && inserted[0]) {
        const finalPlano = inserted[0];
        const syncList = updated.map(p => (p.id === id ? finalPlano : p));
        setLocalData(STORAGE_KEYS.PLANOS, syncList);
        return finalPlano;
      }
    } catch (err) {
      console.warn('Erro ao inserir plano alimentar no Neon:', err.message);
    }
  }

  return newPlano;
}

export async function updatePlanoAlimentar(sql, planoId, planoData) {
  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  const updated = current.map(p => (p.id === planoId ? { ...p, ...planoData } : p));
  setLocalData(STORAGE_KEYS.PLANOS, updated);

  if (sql) {
    try {
      const conteudoJson = typeof planoData.conteudo === 'string' ? planoData.conteudo : JSON.stringify(planoData.conteudo);
      await sql`
        UPDATE planos_alimentares SET
          titulo = ${planoData.titulo || 'Plano Alimentar'},
          conteudo = ${conteudoJson}::jsonb
        WHERE id = ${planoId}
      `;
    } catch (err) {
      console.warn('Erro ao atualizar plano alimentar no Neon:', err.message);
    }
  }
  return { id: planoId, ...planoData };
}

export async function deletePlanoAlimentar(sql, planoId) {
  const current = getLocalData(STORAGE_KEYS.PLANOS, []);
  setLocalData(STORAGE_KEYS.PLANOS, current.filter(p => p.id !== planoId));

  if (sql) {
    try {
      await sql`DELETE FROM planos_alimentares WHERE id = ${planoId}`;
    } catch (err) {
      console.warn('Erro ao excluir plano alimentar no Neon:', err.message);
    }
  }
  return true;
}
