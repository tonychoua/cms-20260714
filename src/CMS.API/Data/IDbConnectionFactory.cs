using System.Data;

namespace CMS.API.Data;

/// <summary>Creates ADO.NET connections for Dapper. One place owns the connection string.</summary>
public interface IDbConnectionFactory
{
    IDbConnection Create();
}
