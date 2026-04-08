package com.jieliedu.platform.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.jieliedu.platform.entity.Account;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * 用户主体
 */
@Data
@AllArgsConstructor
public class UserPrincipal implements UserDetails {
    
    private static final long serialVersionUID = 1L;
    
    private Integer id;
    private String username;
    private String identityNo;
    
    @JsonIgnore
    private String password;
    
    private String role;
    private String school;
    private Boolean isActive;
    
    private Collection<? extends GrantedAuthority> authorities;
    
    public static UserPrincipal create(Account account) {
        return new UserPrincipal(
                account.getId(),
                account.getUsername(),
                account.getIdentityNo(),
                account.getHashedPassword(),
                account.getRole(),
                account.getSchool(),
                account.getIsActive(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + account.getRole().toUpperCase()))
        );
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }
    
    @Override
    public String getPassword() {
        return password;
    }
    
    @Override
    public String getUsername() {
        return username != null ? username : identityNo;
    }
    
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }
    
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }
    
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }
    
    @Override
    public boolean isEnabled() {
        return isActive != null ? isActive : true;
    }
}
