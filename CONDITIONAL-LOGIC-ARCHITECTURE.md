# Conditional Logic Architecture Diagrams

## System Overview Diagram

```mermaid
graph TB
    A[Form Builder] --> B[Field Editor Dialog]
    B --> C[Conditional Logic Settings]
    C --> D{Enable Conditions?}
    
    D -->|Yes| E[Logic Operator Selection]
    D -->|No| F[Field Always Visible]
    
    E --> G[AND/OR Logic]
    G --> H[Add Condition Rules]
    
    H --> I[Rule Configuration]
    I --> J[Target Field Selection]
    I --> K[Operator Selection]
    I --> L[Value Input]
    
    J --> M[Field Type Detection]
    M --> N{Field Type}
    
    N -->|TEXT/EMAIL/PHONE| O[equals, notEquals, contains]
    N -->|NUMBER/DATE/TIME| P[equals, notEquals, greaterThan, lessThan]
    N -->|DROPDOWN/RADIO/CHECKBOX| Q[equals, notEquals only]
    N -->|RATING/SLIDER/SCALE| R[equals, notEquals, greaterThan, lessThan]
    
    K --> S[Dynamic Value Input]
    S --> T{Target Field Type}
    T -->|Options-based| U[Dropdown Selection]
    T -->|Date/Time| V[Date/Time Picker]
    T -->|Number| W[Number Input]
    T -->|Text| X[Text Input]
    
    L --> Y[Rule Preview]
    Y --> Z[Condition Explanation]
    
    AA[Form Preview] --> BB[Field Visibility Evaluation]
    BB --> CC[Real-time Condition Check]
    CC --> DD[evaluateCondition Function]
    
    DD --> EE{Logic Operator}
    EE -->|AND| FF[All rules must pass]
    EE -->|OR| GG[Any rule must pass]
    
    FF --> HH[Field Show/Hide]
    GG --> HH
    
    II[Public Form] --> JJ[Embed Form Logic]
    JJ --> KK[Same Evaluation Logic]
    KK --> LL[Dynamic Field Visibility]
    
    MM[Debug Panel] --> NN[Real-time Status]
    NN --> OO[Rule Evaluation Results]
    NN --> PP[Current Field Values]
    NN --> QQ[Visibility Status]
    
    style A fill:#e1f5fe
    style AA fill:#e8f5e8
    style II fill:#fff3e0
    style MM fill:#f3e5f5
    style DD fill:#ffebee
```

## Data Flow Diagram

```mermaid
sequenceDiagram
    participant User
    participant FormBuilder
    participant FieldEditor
    participant ConditionEngine
    participant Preview
    participant Database
    
    User->>FormBuilder: Create/Edit Field
    FormBuilder->>FieldEditor: Open Field Dialog
    
    User->>FieldEditor: Enable Conditions
    FieldEditor->>FieldEditor: Show Condition UI
    
    User->>FieldEditor: Add Condition Rule
    FieldEditor->>FieldEditor: Select Target Field
    FieldEditor->>FieldEditor: Choose Operator
    FieldEditor->>FieldEditor: Set Value
    
    User->>FieldEditor: Save Field
    FieldEditor->>Database: Store Field with Conditions
    Database-->>FieldEditor: Confirm Save
    
    User->>Preview: Open Form Preview
    Preview->>Database: Load Form & Fields
    Database-->>Preview: Return Form Data
    
    User->>Preview: Fill Form Field
    Preview->>ConditionEngine: Evaluate All Conditions
    ConditionEngine->>ConditionEngine: Check Each Rule
    ConditionEngine-->>Preview: Return Visibility States
    Preview->>Preview: Update Field Visibility
    
    Note over Preview: Debug Panel shows real-time evaluation
```

## Component Architecture

```mermaid
graph LR
    subgraph "Form Builder"
        A[FormBuilderPage]
        B[FieldEditorDialog]
        C[ConditionBuilder]
        D[RuleEditor]
    end
    
    subgraph "Preview System"
        E[FormPreviewPage]
        F[FieldRenderer]
        G[DebugPanel]
    end
    
    subgraph "Public Forms"
        H[EmbedFormPage]
        I[PublicFormRenderer]
    end
    
    subgraph "Core Logic"
        J[evaluateCondition]
        K[getOperatorsForField]
        L[renderConditionValueInput]
    end
    
    subgraph "Data Layer"
        M[FormField Model]
        N[Conditions Schema]
        O[Database]
    end
    
    A --> B
    B --> C
    C --> D
    
    E --> F
    E --> G
    
    H --> I
    
    F --> J
    G --> J
    I --> J
    
    C --> K
    C --> L
    
    J --> M
    M --> N
    N --> O
    
    style J fill:#ffeb3b
    style M fill:#4caf50
    style O fill:#2196f3
```

## Field Type Support Matrix

```mermaid
graph TD
    subgraph "Text Fields"
        A[TEXT] --> A1[equals, notEquals, contains]
        B[LONG_TEXT] --> A1
        C[EMAIL] --> A1
        D[PHONE] --> A1
        E[URL] --> A1
    end
    
    subgraph "Numeric Fields"
        F[NUMBER] --> F1[equals, notEquals, greaterThan, lessThan]
        G[RATING] --> F1
        H[SLIDER] --> F1
        I[SCALE] --> F1
    end
    
    subgraph "Date/Time Fields"
        J[DATE] --> J1[equals, notEquals, greaterThan, lessThan]
        K[TIME] --> J1
        L[DATETIME] --> J1
    end
    
    subgraph "Option Fields"
        M[DROPDOWN] --> M1[equals, notEquals]
        N[RADIO] --> M1
        O[CHECKBOX] --> M1
    end
    
    subgraph "Special Fields"
        P[FILE] --> P1[equals, notEquals]
    end
    
    style A1 fill:#e8f5e8
    style F1 fill:#e3f2fd
    style J1 fill:#fff3e0
    style M1 fill:#f3e5f5
    style P1 fill:#fce4ec
```

## Condition Evaluation Flow

```mermaid
flowchart TD
    A[Form Value Changes] --> B[Trigger Condition Evaluation]
    B --> C[Get All Fields with Conditions]
    
    C --> D{For Each Field}
    D --> E[Get Field Conditions]
    E --> F{Has Conditions?}
    
    F -->|No| G[Field Always Visible]
    F -->|Yes| H[Get Logic Operator]
    
    H --> I{Logic Operator Type}
    I -->|AND| J[All Rules Must Pass]
    I -->|OR| K[Any Rule Must Pass]
    
    J --> L[Evaluate All Rules]
    K --> M[Evaluate All Rules]
    
    L --> N{All Rules True?}
    M --> O{Any Rule True?}
    
    N -->|Yes| P[Show Field]
    N -->|No| Q[Hide Field]
    O -->|Yes| P
    O -->|No| Q
    
    P --> R[Update Field Visibility]
    Q --> R
    G --> R
    
    R --> S[Update Debug Panel]
    S --> T[Re-render Form]
    
    T --> U{More Fields?}
    U -->|Yes| D
    U -->|No| V[Evaluation Complete]
    
    style P fill:#c8e6c9
    style Q fill:#ffcdd2
    style V fill:#e1f5fe
```

## Database Schema Diagram

```mermaid
erDiagram
    FormField {
        string id PK
        string formId FK
        string type
        string label
        string placeholder
        boolean required
        json options
        json config
        integer order
        integer page
        json conditions
        timestamp createdAt
        timestamp updatedAt
    }
    
    Conditions {
        string logicOperator
        array rules
    }
    
    ConditionRule {
        string fieldId
        string operator
        any value
    }
    
    FormField ||--o{ Conditions : has
    Conditions ||--o{ ConditionRule : contains
```

## Integration Points

```mermaid
graph TB
    subgraph "Frontend Components"
        A[Form Builder UI]
        B[Preview Component]
        C[Public Form Component]
        D[Debug Panel]
    end
    
    subgraph "Backend API"
        E[Forms Controller]
        F[Fields Endpoints]
        G[Database Layer]
    end
    
    subgraph "Evaluation Engine"
        H[evaluateCondition Function]
        I[Operator Logic]
        J[Value Comparison]
    end
    
    A --> E
    A --> H
    B --> H
    C --> H
    D --> H
    
    E --> F
    F --> G
    
    H --> I
    I --> J
    
    style H fill:#ffeb3b
    style A fill:#e3f2fd
    style E fill:#e8f5e8
```

---

**Generated**: June 3, 2025  
**Purpose**: Visual reference for conditional logic architecture  
**Maintenance**: Update when system architecture changes 