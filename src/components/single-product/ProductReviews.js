import React, { useState } from 'react';
import StarRating from './StarRating';

const ProductReviews = ({ reviews = [], averageRating = 0, productId }) => {
  const [newReview, setNewReview] = useState({
    rating: 5,
    name: '',
    email: '',
    comment: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Calcula a distribuição de estrelas nas avaliações
  const getStarDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]; // 5, 4, 3, 2, 1 estrelas

    if (!reviews.length) return distribution;

    reviews.forEach(review => {
      const rating = Number(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[5 - rating]++;
      }
    });

    return distribution;
  };

  const starDistribution = getStarDistribution();
  const totalReviews = reviews.length;

  // Calcula a porcentagem de cada classificação de estrela
  const getPercentage = (count) => {
    if (totalReviews === 0) return 0;
    return (count / totalReviews) * 100;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({ ...prev, [name]: value }));
  };

  const handleRatingChange = (rating) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aqui você implementaria a lógica para enviar a avaliação para o backend
    // Por exemplo:
    console.log('Enviando avaliação:', newReview);
    
    // Simulando sucesso após envio:
    setSubmitStatus('success');
    
    // Resetar formulário após envio bem-sucedido
    setTimeout(() => {
      setNewReview({
        rating: 5,
        name: '',
        email: '',
        comment: ''
      });
      setShowForm(false);
      setSubmitStatus(null);
    }, 3000);
  };

  return (
    <div className="product-reviews">
      {/* Resumo das avaliações */}
      <div className="reviews-summary">
        <div className="average-rating">
          <div className="rating-value">{averageRating.toFixed(1)}</div>
          <StarRating value={averageRating} readOnly={true} size="large" />
          <div className="rating-count">Com base em {totalReviews} avaliações</div>
        </div>
        
        <div className="rating-distribution">
          {starDistribution.map((count, index) => {
            const stars = 5 - index;
            return (
              <div key={stars} className="rating-bar">
                <span className="stars">{stars} estrela{stars !== 1 ? 's' : ''}</span>
                <div className="progress-bar">
                  <div 
                    className="progress" 
                    style={{ width: `${getPercentage(count)}%` }}
                  ></div>
                </div>
                <span className="count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão para avaliar */}
      {!showForm ? (
        <button 
          className="write-review-button"
          onClick={() => setShowForm(true)}
        >
          Avaliar Produto
        </button>
      ) : null}

      {/* Formulário de avaliação */}
      {showForm && (
        <div className="review-form-container">
          <h3>Deixe sua avaliação</h3>
          {submitStatus === 'success' ? (
            <div className="success-message">
              Sua avaliação foi enviada com sucesso! Obrigado pela contribuição.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="review-form">
              <div className="form-group">
                <label>Avaliação</label>
                <div className="star-rating-input">
                  <StarRating 
                    value={newReview.rating} 
                    onChange={handleRatingChange} 
                    readOnly={false}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="review-name">Nome*</label>
                <input
                  id="review-name"
                  type="text"
                  name="name"
                  value={newReview.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="review-email">E-mail*</label>
                <input
                  id="review-email"
                  type="email"
                  name="email"
                  value={newReview.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="review-comment">Comentário*</label>
                <textarea
                  id="review-comment"
                  name="comment"
                  value={newReview.comment}
                  onChange={handleInputChange}
                  rows="5"
                  required
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-review">
                  Enviar Avaliação
                </button>
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Lista de avaliações */}
      <div className="reviews-list">
        <h3>Avaliações dos clientes</h3>
        
        {reviews.length === 0 ? (
          <p className="no-reviews">Este produto ainda não possui avaliações. Seja o primeiro a avaliar!</p>
        ) : (
          reviews.map((review, index) => (
            <div key={index} className="review-item">
              <div className="review-header">
                <StarRating value={review.rating} readOnly={true} />
                <span className="review-author">{review.author}</span>
                <span className="review-date">{new Date(review.date).toLocaleDateString()}</span>
              </div>
              <div className="review-content">{review.content}</div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .product-reviews {
          margin-top: 20px;
        }
        
        .reviews-summary {
          display: flex;
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .average-rating {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-right: 30px;
          margin-right: 30px;
          border-right: 1px solid #ddd;
          min-width: 150px;
        }
        
        .rating-value {
          font-size: 48px;
          font-weight: 700;
          color: #FF6600;
          line-height: 1;
          margin-bottom: 5px;
        }
        
        .rating-count {
          font-size: 14px;
          color: #666;
          margin-top: 10px;
        }
        
        .rating-distribution {
          flex: 1;
        }
        
        .rating-bar {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .stars {
          width: 80px;
          font-size: 14px;
        }
        
        .progress-bar {
          flex: 1;
          height: 12px;
          background-color: #e0e0e0;
          border-radius: 6px;
          margin: 0 10px;
          overflow: hidden;
        }
        
        .progress {
          height: 100%;
          background-color: #FF6600;
        }
        
        .count {
          width: 30px;
          text-align: right;
          font-size: 14px;
        }
        
        .write-review-button {
          padding: 10px 20px;
          background-color: #FF6600;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          margin-bottom: 30px;
        }
        
        .write-review-button:hover {
          background-color: #E65C00;
        }
        
        .review-form-container {
          margin-bottom: 30px;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 8px;
        }
        
        .review-form-container h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 18px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .star-rating-input {
          margin: 5px 0;
        }
        
        .review-form input,
        .review-form textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        
        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .submit-review {
          padding: 10px 20px;
          background-color: #FF6600;
          color: white;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .submit-review:hover {
          background-color: #E65C00;
        }
        
        .cancel-button {
          padding: 10px 20px;
          background-color: #f0f0f0;
          color: #333;
          border: none;
          border-radius: 4px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .cancel-button:hover {
          background-color: #e0e0e0;
        }
        
        .success-message {
          padding: 15px;
          background-color: #d4edda;
          color: #155724;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .reviews-list h3 {
          font-size: 18px;
          margin-bottom: 20px;
        }
        
        .no-reviews {
          color: #666;
          font-style: italic;
        }
        
        .review-item {
          padding: 20px 0;
          border-bottom: 1px solid #eee;
        }
        
        .review-item:last-child {
          border-bottom: none;
        }
        
        .review-header {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        
        .review-author {
          font-weight: 600;
          margin-left: 10px;
        }
        
        .review-date {
          color: #777;
          font-size: 14px;
          margin-left: 10px;
        }
        
        .review-content {
          line-height: 1.6;
        }
        
        /* Responsividade */
        @media (max-width: 768px) {
          .reviews-summary {
            flex-direction: column;
          }
          
          .average-rating {
            padding-right: 0;
            margin-right: 0;
            border-right: none;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #ddd;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductReviews;