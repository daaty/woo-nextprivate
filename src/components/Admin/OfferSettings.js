import React, { useState, useEffect } from 'react';
import styles from './Admin.module.css';

const OfferSettings = () => {
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Carregar data de expiração atual
    const loadEndDate = async () => {
      try {
        const response = await fetch('/api/offer-settings');
        const data = await response.json();
        
        if (data.endDate) {
          // Formatar a data para o formato ISO para o input datetime-local
          const formattedDate = new Date(data.endDate).toISOString().slice(0, 16);
          setEndDate(formattedDate);
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    
    loadEndDate();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/offer-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endDate }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage('Configurações salvas com sucesso!');
      } else {
        setMessage(`Erro: ${data.error}`);
      }
    } catch (error) {
      setMessage('Erro ao salvar configurações');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <h2>Configurações de Ofertas Exclusivas</h2>
      
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formGroup}>
          <label htmlFor="endDate">Data de Expiração da Oferta</label>
          <input
            type="datetime-local"
            id="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={styles.formControl}
            required
          />
          <p className={styles.helpText}>
            Defina quando as ofertas exclusivas irão expirar.
          </p>
        </div>
        
        <button 
          type="submit" 
          className={styles.submitBtn} 
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
        
        {message && (
          <div className={`${styles.message} ${message.includes('Erro') ? styles.error : styles.success}`}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default OfferSettings;
